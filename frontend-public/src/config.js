export const CHAIN_ID = 19735;
export const RPC_URL = '/api';
export const BLOCKCHAIN_RPC = 'http://localhost:8545';
export let CONTRACT_ADDRESS = '';

export async function loadConfig() {
  try {
    const res = await fetch('https://sukhoi.onrender.com/api/health');
    const data = await res.json();
    if (data.contractAddress) CONTRACT_ADDRESS = data.contractAddress;
    return data;
  } catch (e) {
    console.warn('Could not load config from backend');
    return null;
  }
}

export const SKH_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function sendWithMemo(address to, uint256 amount, string message)'
];
