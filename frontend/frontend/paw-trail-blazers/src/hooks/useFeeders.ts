import { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarClient } from '@/lib/stellar/client';
import { walletManager } from '@/lib/stellar/wallet';
import { FeederProfile, ActivityStats } from '@/types/stellar';

// Tell TypeScript about the Freighter global object
declare global {
  interface Window {
    freighterApi?: {
      getPublicKey: () => Promise<string>;
    };
  }
}


export function useFeeders() {
  const [feeders, setFeeders] = useState<FeederProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all feeders from blockchain
  const fetchFeeders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching total feeders count from blockchain...');
      
      // Get total number of registered feeders
      const totalFeeders = await stellarClient.invokeContractMethod('get_total_feeders', []);
      
      console.log('Total feeders on blockchain:', totalFeeders);
      
      if (totalFeeders === 0) {
        setFeeders([]);
        setLoading(false);
        return;
      }

      // Fetch each feeder profile from blockchain
      const feederPromises = [];
      for (let i = 1; i <= totalFeeders; i++) {
        feederPromises.push(
          stellarClient.invokeContractMethod('get_feeder', [
            StellarSdk.nativeToScVal(i, { type: 'u64' })
          ])
        );
      }
      
      const feedersData = await Promise.all(feederPromises);
      console.log('Fetched feeders from blockchain:', feedersData);
      
      setFeeders(feedersData);
    } catch (error) {
      console.error('Error fetching feeders from blockchain:', error);
      setError('Failed to fetch feeders from blockchain. Make sure the contract is deployed and initialized.');
    } finally {
      setLoading(false);
    }
  };
 
  
  // Register new feeder - THIS CREATES A REAL BLOCKCHAIN TRANSACTION
  const registerFeeder = async (
    walletAddress: string,
    feederData: {
      name: string;
      organization_type: string;
      location: string;
      registration_number: string;
      contact_info: string;
    }
  ) => {
  try {
  setLoading(true);
  setError(null);

  const isConnected = await walletManager.isWalletConnected();
if (!isConnected) {
  throw new Error("Freighter wallet not found. Please install or open it.");
}

// Fetch wallet address (safe way)
if (!walletAddress || !walletAddress.startsWith("G")) {
  walletAddress = await walletManager.connectWallet();
}

if (!walletAddress || !walletAddress.startsWith("G")) {
  throw new Error("Invalid wallet address. Please reconnect your Freighter wallet.");
}

console.log("Connected Freighter wallet:", walletAddress);

  // ✅ Fetch address if not already set
  if (!walletAddress || !walletAddress.startsWith("G")) {
    walletAddress = await window.freighterApi.getPublicKey();
  }

  if (!walletAddress || !walletAddress.startsWith("G")) {
    throw new Error("Invalid wallet address. Please reconnect your Freighter wallet.");
  }

  console.log("Connected Freighter wallet:", walletAddress);

  // ✅ Prepare args
  const args = [
    StellarSdk.Address.fromString(walletAddress).toScVal(),
    StellarSdk.nativeToScVal(feederData.name, { type: "string" }),
    StellarSdk.nativeToScVal(feederData.organization_type, { type: "string" }),
    StellarSdk.nativeToScVal(feederData.location, { type: "string" }),
    StellarSdk.nativeToScVal(feederData.registration_number, { type: "string" }),
    StellarSdk.nativeToScVal(feederData.contact_info, { type: "string" }),
  ];

  console.log("Submitting transaction to Stellar network...");

  const operation = stellarClient.contract.call("register_feeder", ...args);

  // Build, sign, and submit the transaction
  const response = await stellarClient.buildAndSubmitTransaction(
    walletAddress,
    operation,
    async (tx) => await walletManager.signTransaction(tx.toXDR())
  );

  console.log("✅ Feeder registered on blockchain!", response);

  await fetchFeeders();
  return response;
} catch (error: any) {
      console.error('Error registering feeder on blockchain:', error);
      
      // Better error messages for users
      if (error.message?.includes('User declined')) {
        setError('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient')) {
        setError('Insufficient XLM balance to pay for transaction');
      } else if (error.message?.includes('not found')) {
        setError('Account not found on Stellar network. Make sure your wallet is funded.');
      } else {
        setError('Failed to register feeder. Please try again.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get feeder statistics from blockchain
  const getFeederStats = async (feederId: number): Promise<ActivityStats | null> => {
    try {
      console.log(`Fetching stats for feeder ${feederId} from blockchain...`);
      
      const stats = await stellarClient.invokeContractMethod('get_feeder_stats', [
        StellarSdk.nativeToScVal(feederId, { type: 'u64' })
      ]);
      
      console.log(`Stats for feeder ${feederId}:`, stats);
      return stats;
    } catch (error) {
      console.error(`Error fetching stats for feeder ${feederId} from blockchain:`, error);
      return null;
    }
  };

  // Get a single feeder by ID from blockchain
  const getFeeder = async (feederId: number): Promise<FeederProfile | null> => {
    try {
      console.log(`Fetching feeder ${feederId} from blockchain...`);
      
      const feeder = await stellarClient.invokeContractMethod('get_feeder', [
        StellarSdk.nativeToScVal(feederId, { type: 'u64' })
      ]);
      
      console.log(`Feeder ${feederId}:`, feeder);
      return feeder;
    } catch (error) {
      console.error(`Error fetching feeder ${feederId} from blockchain:`, error);
      return null;
    }
  };

  // Filter verified feeders (from cached data)
  const getVerifiedFeeders = (): FeederProfile[] => {
    return feeders.filter(feeder => feeder.is_verified);
  };

  // Filter by location (from cached data)
  const getFeedersByLocation = (location: string): FeederProfile[] => {
    return feeders.filter(feeder => 
      feeder.location.toLowerCase().includes(location.toLowerCase())
    );
  };

  // Filter by organization type (from cached data)
  const getFeedersByType = (type: string): FeederProfile[] => {
    return feeders.filter(feeder => feeder.organization_type === type);
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchFeeders();
  }, []);

  return { 
    feeders,           // All feeders from blockchain
    loading,           // Loading state
    error,             // Error message if any
    registerFeeder,    // Register new feeder (creates blockchain transaction)
    getFeederStats,    // Get stats for specific feeder
    getFeeder,         // Get single feeder by ID
    getVerifiedFeeders, // Filter verified feeders
    getFeedersByLocation, // Filter by location
    getFeedersByType,  // Filter by type
    refetch: fetchFeeders  // Manually refresh from blockchain
  };
}
