import * as StellarSdk from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './config';
import { stellarClient } from './client';
import { walletManager } from './wallet';

/**
 * PawChain Smart Contract Helper Functions
 * These functions provide typed wrappers around the raw contract calls
 */

// ========== DOG MANAGEMENT ==========

export async function registerDog(
  walletAddress: string,
  name: string,
  age: number,
  breed: string,
  location: string,
  healthStatus: string,
  sickness: string
): Promise<number> {
  const args = [
    new StellarSdk.Address(walletAddress).toScVal(),
    StellarSdk.nativeToScVal(name, { type: 'string' }),
    StellarSdk.nativeToScVal(age, { type: 'u32' }),
    StellarSdk.nativeToScVal(breed, { type: 'string' }),
    StellarSdk.nativeToScVal(location, { type: 'string' }),
    StellarSdk.nativeToScVal(healthStatus, { type: 'string' }),
    StellarSdk.nativeToScVal(sickness, { type: 'string' })
  ];

  const operation = stellarClient.contract.call('register_dog', ...args);
  
  return await stellarClient.buildAndSubmitTransaction(
    walletAddress,
    operation,
    async (tx) => {
      // Sign with Freighter - you'll need to import walletManager
      const { walletManager } = await import('./wallet');
      return await walletManager.signTransaction(tx.toXDR());
    }
  );
}

export async function getDog(dogId: number) {
  return await stellarClient.invokeContractMethod('get_dog', [
    StellarSdk.nativeToScVal(dogId, { type: 'u64' })
  ]);
}

export async function getTotalDogs(): Promise<number> {
  return await stellarClient.invokeContractMethod('get_total_dogs', []);
}

export async function updateDogHealth(
  walletAddress: string,
  dogId: number,
  healthStatus: string,
  sickness: string
) {
  const args = [
    new StellarSdk.Address(walletAddress).toScVal(),
    StellarSdk.nativeToScVal(dogId, { type: 'u64' }),
    StellarSdk.nativeToScVal(healthStatus, { type: 'string' }),
    StellarSdk.nativeToScVal(sickness, { type: 'string' })
  ];

  const operation = stellarClient.contract.call('update_dog_health', ...args);
  
  const { walletManager } = await import('./wallet');
  return await stellarClient.buildAndSubmitTransaction(
    walletAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );
}

// ========== FEEDER MANAGEMENT ==========

export async function registerFeeder(
  walletAddress: string,
  name: string,
  organizationType: string,
  location: string,
  registrationNumber: string,
  contactInfo: string
) {
  const args = [
    new StellarSdk.Address(walletAddress).toScVal(),
    StellarSdk.nativeToScVal(name, { type: 'string' }),
    StellarSdk.nativeToScVal(organizationType, { type: 'string' }),
    StellarSdk.nativeToScVal(location, { type: 'string' }),
    StellarSdk.nativeToScVal(registrationNumber, { type: 'string' }),
    StellarSdk.nativeToScVal(contactInfo, { type: 'string' })
  ];

  const operation = stellarClient.contract.call('register_feeder', ...args);
  
  const { walletManager } = await import('./wallet');
  return await stellarClient.buildAndSubmitTransaction(
    walletAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );
}

export async function getFeeder(feederId: number) {
  return await stellarClient.invokeContractMethod('get_feeder', [
    StellarSdk.nativeToScVal(feederId, { type: 'u64' })
  ]);
}

export async function getTotalFeeders(): Promise<number> {
  return await stellarClient.invokeContractMethod('get_total_feeders', []);
}

export async function getFeederStats(feederId: number) {
  return await stellarClient.invokeContractMethod('get_feeder_stats', [
    StellarSdk.nativeToScVal(feederId, { type: 'u64' })
  ]);
}

// ========== DONATION MANAGEMENT ==========

export async function makeDonation(
  donorAddress: string,
  feederId: number,
  amount: string, // in stroops (1 XLM = 10000000 stroops)
  purpose: string,
  dogId?: number
) {
  const args = [
    new StellarSdk.Address(donorAddress).toScVal(),
    StellarSdk.nativeToScVal(feederId, { type: 'u64' }),
    StellarSdk.nativeToScVal(amount, { type: 'i128' }),
    StellarSdk.nativeToScVal(purpose, { type: 'string' }),
    dogId 
      ? StellarSdk.nativeToScVal(dogId, { type: 'u64' }) 
      : StellarSdk.nativeToScVal(null, { type: 'option' })
  ];

  const operation = stellarClient.contract.call('donate', ...args);
  
  const { walletManager } = await import('./wallet');
  return await stellarClient.buildAndSubmitTransaction(
    donorAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );
}

export async function getDonation(donationId: number) {
  return await stellarClient.invokeContractMethod('get_donation', [
    StellarSdk.nativeToScVal(donationId, { type: 'u64' })
  ]);
}

export async function getTotalDonations(): Promise<number> {
  return await stellarClient.invokeContractMethod('get_total_donations', []);
}

// ========== EXPENSE MANAGEMENT ==========

export async function recordExpense(
  feederAddress: string,
  amount: string,
  category: string,
  description: string,
  receiptHash: string,
  dogsAffected: number[]
) {
  const args = [
    new StellarSdk.Address(feederAddress).toScVal(),
    StellarSdk.nativeToScVal(amount, { type: 'i128' }),
    StellarSdk.nativeToScVal(category, { type: 'string' }),
    StellarSdk.nativeToScVal(description, { type: 'string' }),
    StellarSdk.nativeToScVal(receiptHash, { type: 'string' }),
    StellarSdk.nativeToScVal(dogsAffected.map(id => BigInt(id)), { type: 'vec' })
  ];

  const operation = stellarClient.contract.call('record_expense', ...args);
  
  const { walletManager } = await import('./wallet');
  return await stellarClient.buildAndSubmitTransaction(
    feederAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );
}

export async function getExpense(expenseId: number) {
  return await stellarClient.invokeContractMethod('get_expense', [
    StellarSdk.nativeToScVal(expenseId, { type: 'u64' })
  ]);
}

export async function getTotalExpenses(): Promise<number> {
  return await stellarClient.invokeContractMethod('get_total_expenses', []);
}

// ========== TREATMENT MANAGEMENT ==========

export async function recordTreatment(
  feederAddress: string,
  dogId: number,
  treatmentType: string,
  description: string,
  cost: string,
  veterinarian: string,
  outcome: string
) {
  const args = [
    new StellarSdk.Address(feederAddress).toScVal(),
    StellarSdk.nativeToScVal(dogId, { type: 'u64' }),
    StellarSdk.nativeToScVal(treatmentType, { type: 'string' }),
    StellarSdk.nativeToScVal(description, { type: 'string' }),
    StellarSdk.nativeToScVal(cost, { type: 'i128' }),
    StellarSdk.nativeToScVal(veterinarian, { type: 'string' }),
    StellarSdk.nativeToScVal(outcome, { type: 'string' })
  ];

  const operation = stellarClient.contract.call('record_treatment', ...args);
  
  const { walletManager } = await import('./wallet');
  return await stellarClient.buildAndSubmitTransaction(
    feederAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );
}

export async function getTreatment(treatmentId: number) {
  return await stellarClient.invokeContractMethod('get_treatment', [
    StellarSdk.nativeToScVal(treatmentId, { type: 'u64' })
  ]);
}

// ========== HELPER FUNCTIONS ==========

/**
 * Convert XLM to stroops (smallest unit)
 * 1 XLM = 10,000,000 stroops
 */
export function xlmToStroops(xlm: number): string {
  return (xlm * 10000000).toString();
}

/**
 * Convert stroops to XLM
 */
export function stroopsToXlm(stroops: string): number {
  return parseInt(stroops) / 10000000;
}

/**
 * Check if contract is initialized
 */
export async function isContractInitialized(): Promise<boolean> {
  try {
    await getTotalDogs();
    return true;
  } catch (error) {
    console.error('Contract not initialized:', error);
    return false;
  }
}

/**
 * Get contract info
 */
export function getContractInfo() {
  return {
    contractId: STELLAR_CONFIG.contractId,
    network: STELLAR_CONFIG.network,
    rpcUrl: STELLAR_CONFIG.rpcUrl,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase
  };
}

// Export all contract methods as a namespace
export const PawChainContract = {
  // Dogs
  registerDog,
  getDog,
  getTotalDogs,
  updateDogHealth,
  
  // Feeders
  registerFeeder,
  getFeeder,
  getTotalFeeders,
  getFeederStats,
  
  // Donations
  makeDonation,
  getDonation,
  getTotalDonations,
  
  // Expenses
  recordExpense,
  getExpense,
  getTotalExpenses,
  
  // Treatments
  recordTreatment,
  getTreatment,
  
  // Helpers
  xlmToStroops,
  stroopsToXlm,
  isContractInitialized,
  getContractInfo
};