function readCsrfCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return readCsrfCookie();
}

function readHeaders(init?: RequestInit): Headers {
  return new Headers(init?.headers);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (!window.location.pathname.startsWith('/login')) {
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

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(
    path,
    withDefaults(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(
    path,
    withDefaults(path, {
      ...init,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(
    path,
    withDefaults(path, {
      ...init,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return handleResponse<T>(response);
}
