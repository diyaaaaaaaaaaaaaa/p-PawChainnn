export interface DogProfile {
  dog_id: number;
  name: string;
  age: number;
  breed: string;
  location: string;
  health_status: string;
  sickness: string;
  feeder_id: number;
  registered_date: number;
  last_updated: number;
  is_active: boolean;
}

export interface FeederProfile {
  feeder_id: number;
  name: string;
  organization_type: string;
  location: string;
  wallet_address: string;
  registration_number: string;
  contact_info: string;
  registered_date: number;
  is_verified: boolean;
  total_received: string;
  total_spent: string;
}

export interface Donation {
  donation_id: number;
  donor_address: string;
  feeder_id: number;
  amount: string;
  timestamp: number;
  purpose: string;
  dog_id?: number;
  transaction_hash: string;
}

export interface ExpenseRecord {
  expense_id: number;
  feeder_id: number;
  amount: string;
  category: string;
  description: string;
  timestamp: number;
  receipt_hash: string;
  dogs_affected: number[];
  verified: boolean;
}

export interface ActivityStats {
  feeder_id: number;
  dogs_fed: number;
  dogs_vaccinated: number;
  dogs_spayed: number;
  dogs_neutered: number;
  dogs_treated: number;
  dogs_rescued: number;
  dogs_adopted: number;
  last_updated: number;
}