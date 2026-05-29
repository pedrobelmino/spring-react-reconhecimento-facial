#!/usr/bin/env node
/**
 * Sync .specs/linear/tasks.json → Linear issues
 *
 * Usage:
 *   node scripts/sync-linear-tasks.mjs
 *   LINEAR_TEAM=FAC LINEAR_DRY_RUN=1 node scripts/sync-linear-tasks.mjs
 *
 * Optional env (.env supported):
 *   LINEAR_API_KEY  — Personal API key (required)
 *   LINEAR_TEAM     — team key (default: FAC)
 *   LINEAR_DRY_RUN  — set to 1 to preview without creating
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envPath = join(__dirname, '../.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();
const API = 'https://api.linear.app/graphql';
const DRY_RUN = process.env.LINEAR_DRY_RUN === '1';
const MANIFEST_PATH = join(__dirname, '../.specs/linear/manifest.json');

const config = JSON.parse(
  readFileSync(join(__dirname, '../.specs/linear/tasks.json'), 'utf8')
);

/** MVP P1 implementado — todas as 41 tasks concluídas pelo usuário */
const TASK_STATUS = Object.fromEntries(
  config.tasks.map((task) => [task.key, task.status ?? 'done'])
);

async function gql(query, variables = {}) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.error('❌ LINEAR_API_KEY não definida.');
    console.error('   Crie em: Linear → Settings → API → Personal API keys');
    process.exit(1);
  }
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: key,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function getViewer() {
  const data = await gql(`query { viewer { id name displayName } }`);
  return data.viewer;
}

async function getTeam() {
  const data = await gql(`query { teams { nodes { id name key } } }`);
  const teams = data.teams.nodes;
  if (!teams.length) throw new Error('Nenhum team encontrado no Linear');
  const wanted = process.env.LINEAR_TEAM ?? 'FAC';
  const team = teams.find(
    (t) => t.name === wanted || t.key === wanted || t.id === wanted
  );
  if (!team) {
    throw new Error(
      `Team "${wanted}" não encontrado. Disponíveis: ${teams.map((t) => t.key).join(', ')}`
    );
  }
  return team;
}

async function getWorkflowStates(teamId) {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) { states { nodes { id name type } } }
    }`,
    { id: teamId }
  );
  const states = data.team.states.nodes;
  const byType = Object.fromEntries(states.map((s) => [s.type, s]));
  const byName = Object.fromEntries(
    states.map((s) => [s.name.toLowerCase(), s])
  );
  return { states, byType, byName };
}

function resolveStateId(status, workflow) {
  const map = {
    done: workflow.byName.done?.id ?? workflow.byType.completed?.id,
    in_review:
      workflow.byName['in review']?.id ?? workflow.byType.started?.id,
    in_progress:
      workflow.byName['in progress']?.id ?? workflow.byType.started?.id,
    todo: workflow.byName.todo?.id ?? workflow.byType.unstarted?.id,
    backlog: workflow.byName.backlog?.id ?? workflow.byType.backlog?.id,
  };
  return map[status] ?? map.done;
}

async function findOrCreateProject(teamId, name, summary) {
  const data = await gql(
    `query($filter: ProjectFilter) {
      projects(filter: $filter, first: 5) { nodes { id name url } }
    }`,
    { filter: { name: { eq: name } } }
  );
  if (data.projects.nodes.length) return data.projects.nodes[0];

  if (DRY_RUN) {
    console.log(`[dry-run] Criaria project: ${name}`);
    return { id: 'dry-project', name, url: '#' };
  }

  const created = await gql(
    `mutation($input: ProjectCreateInput!) {
      projectCreate(input: $input) { project { id name url } }
    }`,
    {
      input: {
        name,
        description: summary,
        teamIds: [teamId],
      },
    }
  );
  return created.projectCreate.project;
}

function buildDescription(task, specPath) {
  const status = TASK_STATUS[task.key] ?? 'done';
  const done = status === 'done';
  const deps =
    task.dependsOn.length === 0
      ? 'Nenhuma'
      : task.dependsOn.map((d) => `\`${d}\``).join(', ');
  return [
    `## O quê`,
    task.what,
    '',
    `## Onde`,
    `\`${task.where}\``,
    '',
    `## Depende de`,
    deps,
    '',
    `## Spec / Tasks`,
    `- Milestone: **${task.milestone}**`,
    `- Key: \`${task.key}\``,
    `- Docs: \`${specPath}\``,
    '',
    `## Status`,
    done
      ? '✅ **Implementado** (MVP P1 — Pedro Belmino)'
      : `⏳ **${status}**`,
    '',
    `## Done when`,
    done ? '- [x] Implementação conforme tasks.md' : '- [ ] Implementação conforme tasks.md',
    done ? '- [x] Gate check passa' : '- [ ] Gate check passa',
    done ? '- [x] Commit atômico' : '- [ ] Commit atômico',
  ].join('\n');
}

async function createIssue({ teamId, projectId, task, specPath, stateId, assigneeId }) {
  const title = task.title;
  const description = buildDescription(task, specPath);

  if (DRY_RUN) {
    console.log(`[dry-run] ${task.key}: ${title} → ${TASK_STATUS[task.key] ?? 'done'}`);
    return { id: task.key, identifier: `FAC-?`, url: '#' };
  }

  const data = await gql(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) { issue { id identifier url } }
    }`,
    {
      input: {
        teamId,
        projectId,
        title,
        description,
        priority: task.priority ?? 3,
        stateId,
        assigneeId,
        labelIds: [],
      },
    }
  );
  return data.issueCreate.issue;
}

async function setBlockedBy(issueId, blockerIds) {
  if (!blockerIds.length || DRY_RUN) return;
  for (const blockerId of blockerIds) {
    await gql(
      `mutation($input: IssueRelationCreateInput!) {
        issueRelationCreate(input: $input) { success }
      }`,
      {
        input: {
          issueId: blockerId,
          relatedIssueId: issueId,
          type: 'blocks',
        },
      }
    );
  }
}

async function main() {
  const specPaths = {
    foundation: '.specs/features/platform-foundation/tasks.md',
    cadastro: '.specs/features/cadastro-clientes-faces/tasks.md',
    entrada: '.specs/features/tela-entrada/tasks.md',
  };

  const viewer = await getViewer();
  const team = await getTeam();
  const workflow = await getWorkflowStates(team.id);
  console.log(`Team: ${team.name} (${team.key})`);
  console.log(`Assignee: ${viewer.displayName}`);

  const project = await findOrCreateProject(
    team.id,
    config.projectName,
    config.projectSummary
  );
  console.log(`Project: ${project.name} → ${project.url}`);

  const issueMap = {};

  for (const task of config.tasks) {
    const specPath = specPaths[task.milestone];
    const status = TASK_STATUS[task.key] ?? 'done';
    const stateId = resolveStateId(status, workflow);
    const issue = await createIssue({
      teamId: team.id,
      projectId: project.id,
      task,
      specPath,
      stateId,
      assigneeId: status === 'done' ? viewer.id : undefined,
    });
    issueMap[task.key] = issue;
    const badge = status === 'done' ? '✅' : '⏳';
    console.log(`${badge} ${issue.identifier ?? task.key}: ${task.title}`);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n🔗 Configurando dependências (blocked by)...');
  for (const task of config.tasks) {
    const issue = issueMap[task.key];
    const blockers = task.dependsOn
      .map((k) => issueMap[k]?.id)
      .filter(Boolean);
    if (blockers.length) {
      await setBlockedBy(issue.id, blockers);
      console.log(`   ${task.key} ← blocked by ${task.dependsOn.join(', ')}`);
    }
  }

  const doneCount = config.tasks.filter(
    (t) => (TASK_STATUS[t.key] ?? 'done') === 'done'
  ).length;
  console.log(
    `\n✨ ${config.tasks.length} issues em ${project.url} (${doneCount} Done)`
  );

  const manifest = {
    syncedAt: new Date().toISOString(),
    team: { key: team.key, name: team.name },
    project: { name: project.name, url: project.url },
    assignee: viewer.displayName,
    issues: Object.entries(issueMap).map(([key, issue]) => ({
      key,
      identifier: issue.identifier,
      url: issue.url,
      status: TASK_STATUS[key] ?? 'done',
    })),
  };

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`\n📄 Manifesto salvo: .specs/linear/manifest.json`);
  } else {
    console.log('\nManifesto (dry-run):');
    console.log(JSON.stringify(manifest, null, 2));
  }
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
