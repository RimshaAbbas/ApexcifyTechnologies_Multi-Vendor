const BASE = 'http://localhost:5000/api/v1';
const ORIGIN = 'http://localhost:5000';

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${ORIGIN}${path}`;
}

async function request(method, path, body, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data });
  return data;
}

export const api = {
  get:    (path)             => request('GET',    path),
  post:   (path, body)       => request('POST',   path, body),
  put:    (path, body)       => request('PUT',    path, body),
  patch:  (path, body)       => request('PATCH',  path, body),
  del:    (path)             => request('DELETE', path),
  upload: (path, formData)   => request('POST',   path, formData, true),
  uploadPut: (path, formData)=> request('PUT',    path, formData, true),
};
