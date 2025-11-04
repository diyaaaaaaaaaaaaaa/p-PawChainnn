import { useState, useEffect } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarClient } from '@/lib/stellar/client';
import { walletManager } from '@/lib/stellar/wallet';
import { STELLAR_CONFIG } from '@/lib/stellar/config';
import { DogProfile } from '@/types/stellar';

export function useDogs() {
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dogs
  const fetchDogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get total number of dogs from contract
      const totalDogs = await stellarClient.invokeContractMethod('get_total_dogs', []);
      
      if (totalDogs === 0) {
        setDogs([]);
        return;
      }

      // Fetch each dog's profile
      const dogPromises = [];
      for (let i = 1; i <= totalDogs; i++) {
        dogPromises.push(
          stellarClient.invokeContractMethod('get_dog', [
            StellarSdk.nativeToScVal(i, { type: 'u64' })
          ])
        );
      }
      
      const dogsData = await Promise.all(dogPromises);
      setDogs(dogsData);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setError('Failed to fetch dogs. Please check your connection and contract configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Register new dog
  const registerDog = async (
    walletAddress: string,
    dogData: {
      name: string;
      age: number;
      breed: string;
      location: string;
      health_status: string;
      sickness: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare contract arguments
      const args = [
        StellarSdk.Address.fromString(walletAddress).toScVal(), // feeder address
        StellarSdk.nativeToScVal(dogData.name, { type: 'string' }),
        StellarSdk.nativeToScVal(dogData.age, { type: 'u32' }),
        StellarSdk.nativeToScVal(dogData.breed, { type: 'string' }),
        StellarSdk.nativeToScVal(dogData.location, { type: 'string' }),
        StellarSdk.nativeToScVal(dogData.health_status, { type: 'string' }),
        StellarSdk.nativeToScVal(dogData.sickness, { type: 'string' })
      ];

      // Create contract operation
      const operation = stellarClient.contract.call('register_dog', ...args);

      // Build and submit transaction through wallet
      const response = await stellarClient.buildAndSubmitTransaction(
        walletAddress,
        operation,
        async (tx) => await walletManager.signTransaction(tx.toXDR())
      );

      console.log('Dog registered successfully:', response);
      
      // Refresh dog list
      await fetchDogs();
      
      return response;
    } catch (error) {
      console.error('Error registering dog:', error);
      setError('Failed to register dog. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update dog health status
  const updateDogHealth = async (
    walletAddress: string,
    dogId: number,
    healthStatus: string,
    sickness: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const args = [
        StellarSdk.Address.fromString(walletAddress).toScVal(),
        StellarSdk.nativeToScVal(dogId, { type: 'u64' }),
        StellarSdk.nativeToScVal(healthStatus, { type: 'string' }),
        StellarSdk.nativeToScVal(sickness, { type: 'string' })
      ];

      const operation = stellarClient.contract.call('update_dog_health', ...args);

      const response = await stellarClient.buildAndSubmitTransaction(
        walletAddress,
        operation,
        async (tx) => await walletManager.signTransaction(tx.toXDR())
      );

      console.log('Dog health updated successfully:', response);
      
      // Refresh dog list
      await fetchDogs();
      
      return response;
    } catch (error) {
      console.error('Error updating dog health:', error);
      setError('Failed to update dog health. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get a single dog by ID
  const getDog = async (dogId: number): Promise<DogProfile | null> => {
    try {
      const dog = await stellarClient.invokeContractMethod('get_dog', [
        StellarSdk.nativeToScVal(dogId, { type: 'u64' })
      ]);
      return dog;
    } catch (error) {
      console.error(`Error fetching dog ${dogId}:`, error);
      return null;
    }
  };

  // Get dogs by feeder
  const getDogsByFeeder = (feederId: number): DogProfile[] => {
    return dogs.filter(dog => dog.feeder_id === feederId);
  };

  // Get active dogs only
  const getActiveDogs = (): DogProfile[] => {
    return dogs.filter(dog => dog.is_active);
  };

  // Get dogs by health status
  const getDogsByHealthStatus = (status: string): DogProfile[] => {
    return dogs.filter(dog => dog.health_status === status);
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  return { 
    dogs, 
    loading, 
    error,
    registerDog, 
    updateDogHealth,
    getDog,
    getDogsByFeeder,
    getActiveDogs,
    getDogsByHealthStatus,
    refetch: fetchDogs 
  };
}