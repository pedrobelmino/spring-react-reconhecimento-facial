function readCsrfCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCsrfCookie();
}

let csrfBootstrapPromise: Promise<void> | null = null;

export async function refreshCsrfToken(): Promise<void> {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
}

export async function ensureCsrfToken(): Promise<void> {
  if (readCsrfCookie()) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = refreshCsrfToken().finally(() => {
      csrfBootstrapPromise = null;
    });
  }

  await csrfBootstrapPromise;
}

function readHeaders(init?: RequestInit): Headers {
  return new Headers(init?.headers);
}

function shouldRedirectToLoginOn401(): boolean {
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/entrada')) {
    return false;
  }
  return true;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (shouldRedirectToLoginOn401()) {
      window.location.assign('/login');
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function withDefaults(path: string, init: RequestInit = {}): RequestInit {
  const headers = readHeaders(init);
  const csrfToken = readCsrfCookie();
  if (csrfToken && init.method && init.method !== 'GET') {
    headers.set('X-XSRF-TOKEN', csrfToken);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    ...init,
    credentials: 'include',
    headers,
  };
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, withDefaults(path, { ...init, method: 'GET' }));
  return handleResponse<T>(response);
}

function needsCsrfRefresh(path: string): boolean {
  return path !== '/api/auth/login' && !path.startsWith('/api/access/');
}

async function fetchMutating<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  if (needsCsrfRefresh(path)) {
    await refreshCsrfToken();
  }

  const response = await fetch(
    path,
    withDefaults(path, {
      ...init,
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return fetchMutating<T>(path, 'POST', body, init);
}

export async function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return fetchMutating<T>(path, 'PUT', body, init);
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return fetchMutating<T>(path, 'PATCH', body, init);
}
