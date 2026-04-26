// Centralized API client
const API = {
  async req(method, path, body) {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/index.html';
      throw new Error('Unauthorized');
    }
    const data = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : {};
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },
  get: (path) => API.req('GET', path),
  post: (path, body) => API.req('POST', path, body),
  put: (path, body) => API.req('PUT', path, body),
  delete: (path) => API.req('DELETE', path),
};
