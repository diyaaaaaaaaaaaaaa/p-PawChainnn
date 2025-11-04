export const STELLAR_CONFIG = {
  // Network Configuration
  network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  
  // RPC URLs
  rpcUrl: import.meta.env.VITE_STELLAR_NETWORK === 'mainnet'
    ? 'https://soroban-mainnet.stellar.org'
    : 'https://soroban-testnet.stellar.org',
  
  // Contract Details
  contractId: import.meta.env.VITE_CONTRACT_ID || '', 
  
  // Network Passphrases
  networkPassphrase: import.meta.env.VITE_STELLAR_NETWORK === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015',
  
  // Transaction Details
  deploymentTxHash: '3e34aba8bab90353223660232569cc50a3d3ae0dcaf5b26e82c1c5a07d90a68d'
};

// Token Configuration (USDC or native XLM)
export const TOKEN_CONFIG = {
  tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS || '',
  decimals: 7
};