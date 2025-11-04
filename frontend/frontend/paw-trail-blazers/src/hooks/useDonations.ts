import { useState, useEffect } from 'react';
import { stellarClient } from '@/lib/stellar/client';
import { Donation } from '@/types/stellar';

export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const totalDonations = await stellarClient.invokeContractMethod('get_total_donations', []);
      
      const donationPromises = [];
      for (let i = 1; i <= totalDonations; i++) {
        donationPromises.push(stellarClient.invokeContractMethod('get_donation', [i]));
      }
      
      const donationsData = await Promise.all(donationPromises);
      setDonations(donationsData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeDonation = async (
    donorAddress: string,
    feederId: number,
    amount: string,
    purpose: string,
    dogId?: number
  ) => {
    // Implementation for donation transaction
    // ...
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  return { donations, loading, makeDonation, refetch: fetchDonations };
}