const API_BASE = 'https://sukhoi.onrender.com/api';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export async function createWallet() {
  const res = await fetch(`${API_BASE}/wallet/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse(res);
}

export async function recoverWallet(mnemonic) {
  const res = await fetch(`${API_BASE}/wallet/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mnemonic })
  });
  return handleResponse(res);
}

export async function getWallet(address) {
  const res = await fetch(`${API_BASE}/wallet/${address}`);
  return handleResponse(res);
}

export async function sendTransaction(signedTransaction) {
  const res = await fetch(`${API_BASE}/tx/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedTransaction })
  });
  return handleResponse(res);
}

export async function getTransactionDetails(hash) {
  const res = await fetch(`${API_BASE}/tx/${hash}`);
  return handleResponse(res);
}

export async function contributePresale(address, amountUSDT, paymentToken, txProofMessage) {
  const res = await fetch(`${API_BASE}/presale/contribute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, amountUSDT, paymentToken, txProofMessage })
  });
  return handleResponse(res);
}
