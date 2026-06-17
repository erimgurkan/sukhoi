const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('sukhoi_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  if (response.status === 401) {
    // Session expired or unauthorized, clean and redirect
    logout();
    window.location.href = '/login';
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'İstek başarısız oldu.');
  }
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await handleResponse(res);
  if (data.success && data.token) {
    localStorage.setItem('sukhoi_admin_token', data.token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem('sukhoi_admin_token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('sukhoi_admin_token');
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function getWallets() {
  const res = await fetch(`${API_BASE}/admin/wallets`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function banWallet(address) {
  const res = await fetch(`${API_BASE}/admin/wallets/${address}/ban`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function unbanWallet(address) {
  const res = await fetch(`${API_BASE}/admin/wallets/${address}/unban`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function deleteWallet(address) {
  const res = await fetch(`${API_BASE}/admin/wallets/${address}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function getBlocks(from = null, limit = 20) {
  const queryParams = new URLSearchParams();
  if (from !== null) queryParams.append('from', from);
  queryParams.append('limit', limit);

  const res = await fetch(`${API_BASE}/admin/blocks?${queryParams.toString()}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function getBlockDetail(number) {
  const res = await fetch(`${API_BASE}/admin/blocks/${number}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function mintTokens(to, amount) {
  const res = await fetch(`${API_BASE}/admin/mint`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ to, amount })
  });
  return handleResponse(res);
}

export async function controlNetwork(action) {
  const res = await fetch(`${API_BASE}/admin/network/control`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action })
  });
  return handleResponse(res);
}

export async function getPresaleRequests() {
  const res = await fetch(`${API_BASE}/admin/presale/requests`, {
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function approvePresaleRequest(id) {
  const res = await fetch(`${API_BASE}/admin/presale/approve/${id}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function rejectPresaleRequest(id) {
  const res = await fetch(`${API_BASE}/admin/presale/reject/${id}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(res);
}
