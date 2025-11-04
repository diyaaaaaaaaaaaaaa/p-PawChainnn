// PawChain - Stellar Soroban Smart Contract
// Transparent dog rescue donation tracking on Stellar blockchain

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec,
};

// Dog Profile Structure
#[contracttype]
#[derive(Clone)]
pub struct DogProfile {
    pub dog_id: u64,
    pub name: String,
    pub age: u32,
    pub breed: String,
    pub location: String,
    pub health_status: String, // "Healthy", "Sick", "Critical", "Recovering"
    pub sickness: String,      // Description of illness or "None"
    pub feeder_id: u64,        // ID of the feeder/NGO managing this dog
    pub registered_date: u64,
    pub last_updated: u64,
    pub is_active: bool, // false if adopted or deceased
}

// Feeder/NGO Profile Structure
#[contracttype]
#[derive(Clone)]
pub struct FeederProfile {
    pub feeder_id: u64,
    pub name: String,
    pub organization_type: String, // "Individual", "NGO", "Charity", "Shelter"
    pub location: String,
    pub wallet_address: Address,
    pub registration_number: String, // For NGOs/Charities
    pub contact_info: String,
    pub registered_date: u64,
    pub is_verified: bool, // Admin verification status
    pub total_received: i128,
    pub total_spent: i128,
}

// Donation Record
#[contracttype]
#[derive(Clone)]
pub struct Donation {
    pub donation_id: u64,
    pub donor_address: Address,
    pub feeder_id: u64,
    pub amount: i128,
    pub timestamp: u64,
    pub purpose: String, // "General", "Specific Dog", "Emergency", "Vaccination", etc.
    pub dog_id: Option<u64>, // If donation is for a specific dog
    pub transaction_hash: String,
}

// Expense/Usage Record
#[contracttype]
#[derive(Clone)]
pub struct ExpenseRecord {
    pub expense_id: u64,
    pub feeder_id: u64,
    pub amount: i128,
    pub category: String, // "Food", "Vaccination", "Treatment", "Spaying", "Neutering", "Medicine"
    pub description: String,
    pub timestamp: u64,
    pub receipt_hash: String, // IPFS hash of receipt
    pub dogs_affected: Vec<u64>, // List of dog IDs that benefited
    pub verified: bool,
}

// Activity Statistics
#[contracttype]
#[derive(Clone)]
pub struct ActivityStats {
    pub feeder_id: u64,
    pub dogs_fed: u64,
    pub dogs_vaccinated: u64,
    pub dogs_spayed: u64,
    pub dogs_neutered: u64,
    pub dogs_treated: u64,
    pub dogs_rescued: u64,
    pub dogs_adopted: u64,
    pub last_updated: u64,
}

// Medical Treatment Record
#[contracttype]
#[derive(Clone)]
pub struct TreatmentRecord {
    pub treatment_id: u64,
    pub dog_id: u64,
    pub feeder_id: u64,
    pub treatment_type: String,
    pub description: String,
    pub cost: i128,
    pub date: u64,
    pub veterinarian: String,
    pub outcome: String, // "Successful", "Ongoing", "Failed"
}

// Storage Keys
#[contracttype]
pub enum DataKey {
    DogCount,
    FeederCount,
    DonationCount,
    ExpenseCount,
    TreatmentCount,
    Dog(u64),
    Feeder(u64),
    Donation(u64),
    Expense(u64),
    Treatment(u64),
    FeederStats(u64),
    Admin,
    TokenAddress,
}

#[contract]
pub struct PawChainContract;

#[contractimpl]
impl PawChainContract {
    // Initialize contract with admin address and token
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token);
        env.storage().instance().set(&DataKey::DogCount, &0u64);
        env.storage().instance().set(&DataKey::FeederCount, &0u64);
        env.storage().instance().set(&DataKey::DonationCount, &0u64);
        env.storage().instance().set(&DataKey::ExpenseCount, &0u64);
        env.storage().instance().set(&DataKey::TreatmentCount, &0u64);
    }

    // ========== DOG MANAGEMENT ==========

    // Register a new dog
    pub fn register_dog(
        env: Env,
        feeder: Address,
        name: String,
        age: u32,
        breed: String,
        location: String,
        health_status: String,
        sickness: String,
    ) -> u64 {
        feeder.require_auth();

        // Get feeder_id
        let feeder_id = Self::get_feeder_id_by_address(env.clone(), feeder.clone());
        if feeder_id == 0 {
            panic!("Feeder not registered");
        }

        let mut dog_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::DogCount)
            .unwrap_or(0);
        dog_count += 1;

        let dog = DogProfile {
            dog_id: dog_count,
            name,
            age,
            breed,
            location,
            health_status,
            sickness,
            feeder_id,
            registered_date: env.ledger().timestamp(),
            last_updated: env.ledger().timestamp(),
            is_active: true,
        };

        env.storage()
            .instance()
            .set(&DataKey::Dog(dog_count), &dog);
        env.storage()
            .instance()
            .set(&DataKey::DogCount, &dog_count);

        // Update stats
        Self::increment_stat(env, feeder_id, symbol_short!("rescued"));

        dog_count
    }

    // Update dog health status
    pub fn update_dog_health(
        env: Env,
        feeder: Address,
        dog_id: u64,
        health_status: String,
        sickness: String,
    ) {
        feeder.require_auth();

        let mut dog: DogProfile = env
            .storage()
            .instance()
            .get(&DataKey::Dog(dog_id))
            .unwrap();

        let feeder_id = Self::get_feeder_id_by_address(env.clone(), feeder);
        if dog.feeder_id != feeder_id {
            panic!("Unauthorized");
        }

        dog.health_status = health_status;
        dog.sickness = sickness;
        dog.last_updated = env.ledger().timestamp();

        env.storage().instance().set(&DataKey::Dog(dog_id), &dog);
    }

    // Get dog profile
    pub fn get_dog(env: Env, dog_id: u64) -> DogProfile {
        env.storage()
            .instance()
            .get(&DataKey::Dog(dog_id))
            .unwrap()
    }

    // ========== FEEDER/NGO MANAGEMENT ==========

    // Register a new feeder/NGO
    pub fn register_feeder(
        env: Env,
        wallet_address: Address,
        name: String,
        organization_type: String,
        location: String,
        registration_number: String,
        contact_info: String,
    ) -> u64 {
        wallet_address.require_auth();

        let mut feeder_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::FeederCount)
            .unwrap_or(0);
        feeder_count += 1;

        let feeder = FeederProfile {
            feeder_id: feeder_count,
            name,
            organization_type,
            location,
            wallet_address: wallet_address.clone(),
            registration_number,
            contact_info,
            registered_date: env.ledger().timestamp(),
            is_verified: false,
            total_received: 0,
            total_spent: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::Feeder(feeder_count), &feeder);
        env.storage()
            .instance()
            .set(&DataKey::FeederCount, &feeder_count);

        // Initialize stats
        let stats = ActivityStats {
            feeder_id: feeder_count,
            dogs_fed: 0,
            dogs_vaccinated: 0,
            dogs_spayed: 0,
            dogs_neutered: 0,
            dogs_treated: 0,
            dogs_rescued: 0,
            dogs_adopted: 0,
            last_updated: env.ledger().timestamp(),
        };
        env.storage()
            .instance()
            .set(&DataKey::FeederStats(feeder_count), &stats);

        feeder_count
    }

    // Verify a feeder (admin only)
    pub fn verify_feeder(env: Env, admin: Address, feeder_id: u64) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Unauthorized");
        }

        let mut feeder: FeederProfile = env
            .storage()
            .instance()
            .get(&DataKey::Feeder(feeder_id))
            .unwrap();
        feeder.is_verified = true;
        env.storage()
            .instance()
            .set(&DataKey::Feeder(feeder_id), &feeder);
    }

    // Get feeder profile
    pub fn get_feeder(env: Env, feeder_id: u64) -> FeederProfile {
        env.storage()
            .instance()
            .get(&DataKey::Feeder(feeder_id))
            .unwrap()
    }

    // Get feeder statistics
    pub fn get_feeder_stats(env: Env, feeder_id: u64) -> ActivityStats {
        env.storage()
            .instance()
            .get(&DataKey::FeederStats(feeder_id))
            .unwrap()
    }

    // ========== DONATION MANAGEMENT ==========

    // Record a donation
    pub fn donate(
        env: Env,
        donor: Address,
        feeder_id: u64,
        amount: i128,
        purpose: String,
        dog_id: Option<u64>,
    ) -> u64 {
        donor.require_auth();

        // Get token address
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();
        let token_client = token::Client::new(&env, &token_address);

        // Get feeder wallet
        let feeder: FeederProfile = env
            .storage()
            .instance()
            .get(&DataKey::Feeder(feeder_id))
            .unwrap();

        // Transfer tokens from donor to feeder
        token_client.transfer(&donor, &feeder.wallet_address, &amount);

        // Record donation
        let mut donation_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::DonationCount)
            .unwrap_or(0);
        donation_count += 1;

        let donation = Donation {
            donation_id: donation_count,
            donor_address: donor,
            feeder_id,
            amount,
            timestamp: env.ledger().timestamp(),
            purpose,
            dog_id,
            transaction_hash: String::from_str(&env, "tx_hash_placeholder"),
        };

        env.storage()
            .instance()
            .set(&DataKey::Donation(donation_count), &donation);
        env.storage()
            .instance()
            .set(&DataKey::DonationCount, &donation_count);

        // Update feeder total received
        let mut feeder_data = feeder;
        feeder_data.total_received += amount;
        env.storage()
            .instance()
            .set(&DataKey::Feeder(feeder_id), &feeder_data);

        donation_count
    }

    // Get donation details
    pub fn get_donation(env: Env, donation_id: u64) -> Donation {
        env.storage()
            .instance()
            .get(&DataKey::Donation(donation_id))
            .unwrap()
    }

// ========== EXPENSE TRACKING ==========

    // Record an expense
    pub fn record_expense(
        env: Env,
        feeder: Address,
        amount: i128,
        category: String,
        description: String,
        receipt_hash: String,
        dogs_affected: Vec<u64>,
    ) -> u64 {
        feeder.require_auth();

        let feeder_id = Self::get_feeder_id_by_address(env.clone(), feeder);
        if feeder_id == 0 {
            panic!("Feeder not registered");
        }

        let mut expense_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ExpenseCount)
            .unwrap_or(0);
        expense_count += 1;

        let expense = ExpenseRecord {
            expense_id: expense_count,
            feeder_id,
            amount,
            category: category.clone(),
            description,
            timestamp: env.ledger().timestamp(),
            receipt_hash,
            dogs_affected: dogs_affected.clone(),
            verified: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::Expense(expense_count), &expense);
        env.storage()
            .instance()
            .set(&DataKey::ExpenseCount, &expense_count);

        // Update feeder total spent
        let mut feeder_data: FeederProfile = env
            .storage()
            .instance()
            .get(&DataKey::Feeder(feeder_id))
            .unwrap();
        feeder_data.total_spent += amount;
        env.storage()
            .instance()
            .set(&DataKey::Feeder(feeder_id), &feeder_data);

        // Update stats based on category
        // --- FIX IS HERE ---
        // We must use direct equality '==' for soroban_sdk::String
        if category == String::from_str(&env, "Food") {
            Self::increment_stat_by(env.clone(), feeder_id, symbol_short!("fed"), dogs_affected.len() as u64);
        } else if category == String::from_str(&env, "Vaccination") {
            Self::increment_stat_by(env.clone(), feeder_id, symbol_short!("vacc"), dogs_affected.len() as u64);
        } else if category == String::from_str(&env, "Spaying") {
            Self::increment_stat_by(env.clone(), feeder_id, symbol_short!("spayed"), dogs_affected.len() as u64);
        } else if category == String::from_str(&env, "Neutering") {
            Self::increment_stat_by(env.clone(), feeder_id, symbol_short!("neuter"), dogs_affected.len() as u64);
        } else if category == String::from_str(&env, "Treatment") {
            Self::increment_stat_by(env.clone(), feeder_id, symbol_short!("treated"), dogs_affected.len() as u64);
        }
        // --- END OF FIX ---

        expense_count
    }

    // Get expense details
    pub fn get_expense(env: Env, expense_id: u64) -> ExpenseRecord {
        env.storage()
            .instance()
            .get(&DataKey::Expense(expense_id))
            .unwrap()
    }

    // ========== TREATMENT RECORDS ==========

    // Record a medical treatment
    pub fn record_treatment(
        env: Env,
        feeder: Address,
        dog_id: u64,
        treatment_type: String,
        description: String,
        cost: i128,
        veterinarian: String,
        outcome: String,
    ) -> u64 {
        feeder.require_auth();

        let feeder_id = Self::get_feeder_id_by_address(env.clone(), feeder);
        if feeder_id == 0 {
            panic!("Feeder not registered");
        }

        let mut treatment_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TreatmentCount)
            .unwrap_or(0);
        treatment_count += 1;

        let treatment = TreatmentRecord {
            treatment_id: treatment_count,
            dog_id,
            feeder_id,
            treatment_type,
            description,
            cost,
            date: env.ledger().timestamp(),
            veterinarian,
            outcome,
        };

        env.storage()
            .instance()
            .set(&DataKey::Treatment(treatment_count), &treatment);
        env.storage()
            .instance()
            .set(&DataKey::TreatmentCount, &treatment_count);

        Self::increment_stat(env, feeder_id, symbol_short!("treated"));

        treatment_count
    }

    // Get treatment details
    pub fn get_treatment(env: Env, treatment_id: u64) -> TreatmentRecord {
        env.storage()
            .instance()
            .get(&DataKey::Treatment(treatment_id))
            .unwrap()
    }

    // ========== HELPER FUNCTIONS ==========

    fn get_feeder_id_by_address(env: Env, address: Address) -> u64 {
        let feeder_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::FeederCount)
            .unwrap_or(0);

        for i in 1..=feeder_count {
            let feeder: FeederProfile = env.storage().instance().get(&DataKey::Feeder(i)).unwrap();
            if feeder.wallet_address == address {
                return i;
            }
        }
        0
    }

    fn increment_stat(env: Env, feeder_id: u64, stat_type: soroban_sdk::Symbol) {
        Self::increment_stat_by(env, feeder_id, stat_type, 1);
    }

    fn increment_stat_by(env: Env, feeder_id: u64, stat_type: soroban_sdk::Symbol, count: u64) {
        let mut stats: ActivityStats = env
            .storage()
            .instance()
            .get(&DataKey::FeederStats(feeder_id))
            .unwrap();

        // --- FIX IS HERE ---
        // Instead of converting to a string, compare the symbols directly.
        // This is much more efficient and idiomatic for Soroban.
        if stat_type == symbol_short!("fed") {
            stats.dogs_fed += count;
        } else if stat_type == symbol_short!("vacc") {
            stats.dogs_vaccinated += count;
        } else if stat_type == symbol_short!("spayed") {
            stats.dogs_spayed += count;
        } else if stat_type == symbol_short!("neuter") {
            stats.dogs_neutered += count;
        } else if stat_type == symbol_short!("treated") {
            stats.dogs_treated += count;
        } else if stat_type == symbol_short!("rescued") {
            stats.dogs_rescued += count;
        } else if stat_type == symbol_short!("adopted") {
            stats.dogs_adopted += count;
        }
        // --- END OF FIX ---

        stats.last_updated = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::FeederStats(feeder_id), &stats);
    }

    // Get total counts
    pub fn get_total_dogs(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::DogCount)
            .unwrap_or(0)
    }

    pub fn get_total_feeders(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::FeederCount)
            .unwrap_or(0)
    }

    pub fn get_total_donations(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::DonationCount)
            .unwrap_or(0)
    }

    pub fn get_total_expenses(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ExpenseCount)
            .unwrap_or(0)
    }
}
