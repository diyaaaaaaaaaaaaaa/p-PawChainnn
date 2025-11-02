#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Env, String, Vec,
};

// Helper function to set up the test environment
fn setup_test() -> (
    Env,
    PawChainContractClient,
    Address,
    Address,
    token::Client,
) {
    let env = Env::default();
    env.ledger().set_timestamp(123456789);

    // Register the PawChain contract
    let contract_id = env.register_contract(None, PawChainContract);
    let client = PawChainContractClient::new(&env, &contract_id);

    // Create an admin user
    let admin = Address::random(&env);

    // Set up a mock token contract
    let token_admin = Address::random(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_id);

    // Initialize the PawChain contract
    client.initialize(&admin, &token_id);

    (env, client, admin, token_id, token_client)
}

#[test]
fn test_initialize() {
    // --- Arrange ---
    let env = Env::default();
    let contract_id = env.register_contract(None, PawChainContract);
    let client = PawChainContractClient::new(&env, &contract_id);
    let admin = Address::random(&env);
    let token_id = Address::random(&env); // Just need an address for this test

    // --- Act ---
    client.initialize(&admin, &token_id);

    // --- Assert ---
    // We can't directly read storage, but we can test the "panic if already initialized"
    // which proves *something* was set.
    // We'll also test the getters for initial counts.
    assert_eq!(client.get_total_dogs(), 0);
    assert_eq!(client.get_total_feeders(), 0);
    assert_eq!(client.get_total_donations(), 0);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_initialize_twice() {
    // --- Arrange ---
    let (env, client, admin, token_id, _token_client) = setup_test();

    // --- Act ---
    // The contract was already initialized in setup_test()
    // Calling it again should panic.
    client.initialize(&admin, &token_id);
}

#[test]
fn test_feeder_management() {
    // --- Arrange ---
    let (env, client, admin, _token_id, _token_client) = setup_test();
    let feeder_addr = Address::random(&env);

    // --- Act ---
    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Happy Paws NGO"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "New York"),
        &String::from_str(&env, "NGO-12345"),
        &String::from_str(&env, "contact@happypaws.org"),
    );

    // --- Assert ---
    assert_eq!(feeder_id, 1);
    assert_eq!(client.get_total_feeders(), 1);

    let profile = client.get_feeder(&feeder_id);
    assert_eq!(profile.name, String::from_str(&env, "Happy Paws NGO"));
    assert_eq!(profile.wallet_address, feeder_addr);
    assert_eq!(profile.is_verified, false);
    assert_eq!(profile.total_received, 0);

    // --- Act (Verify) ---
    client.verify_feeder(&admin, &feeder_id);

    // --- Assert (Verify) ---
    let verified_profile = client.get_feeder(&feeder_id);
    assert_eq!(verified_profile.is_verified, true);

    // --- Assert (Stats) ---
    let stats = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats.feeder_id, 1);
    assert_eq!(stats.dogs_rescued, 0);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_verify_feeder_unauthorized() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();
    let feeder_addr = Address::random(&env);
    let imposter_addr = Address::random(&env);

    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Happy Paws NGO"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "New York"),
        &String::from_str(&env, "NGO-12345"),
        &String::from_str(&env, "contact@happypaws.org"),
    );

    // --- Act & Assert ---
    // Imposter tries to verify
    client.verify_feeder(&imposter_addr, &feeder_id);
}

#[test]
fn test_dog_management() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();
    let feeder_addr = Address::random(&env);
    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Happy Paws NGO"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "New York"),
        &String::from_str(&env, "NGO-12345"),
        &String::from_str(&env, "contact@happypaws.org"),
    );

    // --- Act (Register Dog) ---
    let dog_id = client.register_dog(
        &feeder_addr,
        &String::from_str(&env, "Buddy"),
        &2,
        &String::from_str(&env, "Golden Retriever"),
        &String::from_str(&env, "Park Shelter"),
        &String::from_str(&env, "Healthy"),
        &String::from_str(&env, "None"),
    );

    // --- Assert (Register Dog) ---
    assert_eq!(dog_id, 1);
    assert_eq!(client.get_total_dogs(), 1);

    let dog = client.get_dog(&dog_id);
    assert_eq!(dog.name, String::from_str(&env, "Buddy"));
    assert_eq!(dog.feeder_id, feeder_id);
    assert_eq!(dog.is_active, true);

    // Check if feeder stats were updated
    let stats = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats.dogs_rescued, 1);

    // --- Act (Update Health) ---
    env.ledger().set_timestamp(123456999); // Advance time
    client.update_dog_health(
        &feeder_addr,
        &dog_id,
        &String::from_str(&env, "Recovering"),
        &String::from_str(&env, "Kennel Cough"),
    );

    // --- Assert (Update Health) ---
    let updated_dog = client.get_dog(&dog_id);
    assert_eq!(
        updated_dog.health_status,
        String::from_str(&env, "Recovering")
    );
    assert_eq!(
        updated_dog.sickness,
        String::from_str(&env, "Kennel Cough")
    );
    assert_eq!(updated_dog.last_updated, 123456999);
}

#[test]
#[should_panic(expected = "Feeder not registered")]
fn test_register_dog_unregistered_feeder() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();
    let unregistered_addr = Address::random(&env);

    // --- Act & Assert ---
    client.register_dog(
        &unregistered_addr,
        &String::from_str(&env, "Ghost Dog"),
        &1,
        &String::from_str(&env, "Unknown"),
        &String::from_str(&env, "Street"),
        &String::from_str(&env, "Sick"),
        &String::from_str(&env, "Malnutrition"),
    );
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_update_dog_wrong_feeder() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();

    // Feeder 1
    let feeder1_addr = Address::random(&env);
    client.register_feeder(
        &feeder1_addr,
        &String::from_str(&env, "Feeder One"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "NY"),
        &String::from_str(&env, "1"),
        &String::from_str(&env, "1"),
    );

    // Feeder 2
    let feeder2_addr = Address::random(&env);
    client.register_feeder(
        &feeder2_addr,
        &String::from_str(&env, "Feeder Two"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "LA"),
        &String::from_str(&env, "2"),
        &String::from_str(&env, "2"),
    );

    // Feeder 1 registers a dog
    let dog_id = client.register_dog(
        &feeder1_addr,
        &String::from_str(&env, "Buddy"),
        &2,
        &String::from_str(&env, "Retriever"),
        &String::from_str(&env, "Shelter"),
        &String::from_str(&env, "Healthy"),
        &String::from_str(&env, "None"),
    );

    // --- Act & Assert ---
    // Feeder 2 tries to update Feeder 1's dog
    client.update_dog_health(
        &feeder2_addr,
        &dog_id,
        &String::from_str(&env, "Sick"),
        &String::from_str(&env, "Stolen"),
    );
}

#[test]
fn test_donation_flow() {
    // --- Arrange ---
    let (env, client, admin, _token_id, token_client) = setup_test();
    let feeder_addr = Address::random(&env);
    let donor_addr = Address::random(&env);

    // Register and verify feeder
    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Happy Paws NGO"),
        &String::from_str(&env, "NGO"),
        &String::from_str(&env, "New York"),
        &String::from_str(&env, "NGO-12345"),
        &String::from_str(&env, "contact@happypaws.org"),
    );
    client.verify_feeder(&admin, &feeder_id);

    // Mint tokens to donor
    token_client.mint(&donor_addr, &10000);
    assert_eq!(token_client.balance(&donor_addr), 10000);
    assert_eq!(token_client.balance(&feeder_addr), 0);

    // --- Act ---
    let donation_id = client.donate(
        &donor_addr,
        &feeder_id,
        &7500,
        &String::from_str(&env, "General Fund"),
        &None, // No specific dog
    );

    // --- Assert ---
    // Check donation record
    assert_eq!(donation_id, 1);
    assert_eq!(client.get_total_donations(), 1);
    let donation = client.get_donation(&donation_id);
    assert_eq!(donation.donor_address, donor_addr);
    assert_eq!(donation.feeder_id, feeder_id);
    assert_eq!(donation.amount, 7500);
    assert_eq!(donation.dog_id, None);

    // Check token balances
    assert_eq!(token_client.balance(&donor_addr), 2500);
    assert_eq!(token_client.balance(&feeder_addr), 7500);

    // Check feeder profile
    let feeder_profile = client.get_feeder(&feeder_id);
    assert_eq!(feeder_profile.total_received, 7500);
    assert_eq!(feeder_profile.total_spent, 0);
}

#[test]
fn test_expense_and_stats_tracking() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();
    let feeder_addr = Address::random(&env);
    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Feeder"),
        &String::from_str(&env, "Individual"),
        &String::from_str(&env, "City"),
        &String::from_str(&env, "N/A"),
        &String::from_str(&env, "feeder@mail.com"),
    );

    // Register dogs
    let dog1_id = client.register_dog(
        &feeder_addr,
        &String::from_str(&env, "Dog 1"),
        &1,
        &String::from_str(&env, "Indie"),
        &String::from_str(&env, "Street"),
        &String::from_str(&env, "Healthy"),
        &String::from_str(&env, "None"),
    );
    let dog2_id = client.register_dog(
        &feeder_addr,
        &String::from_str(&env, "Dog 2"),
        &2,
        &String::from_str(&env, "Indie"),
        &String::from_str(&env, "Street"),
        &String::from_str(&env, "Healthy"),
        &String::from_str(&env, "None"),
    );

    let stats_before = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats_before.dogs_rescued, 2);
    assert_eq!(stats_before.dogs_fed, 0);
    assert_eq!(stats_before.dogs_vaccinated, 0);

    // --- Act (Record Food Expense) ---
    let mut food_dogs = Vec::new(&env);
    food_dogs.push_back(dog1_id);
    food_dogs.push_back(dog2_id);

    let expense1_id = client.record_expense(
        &feeder_addr,
        &1000,
        &String::from_str(&env, "Food"),
        &String::from_str(&env, "Dog food bags"),
        &String::from_str(&env, "ipfs://hash1"),
        &food_dogs,
    );

    // --- Assert (Food Expense) ---
    assert_eq!(expense1_id, 1);
    assert_eq!(client.get_total_expenses(), 1);

    let feeder_profile = client.get_feeder(&feeder_id);
    assert_eq!(feeder_profile.total_spent, 1000);

    let stats_after_food = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats_after_food.dogs_fed, 2); // Incremented by 2
    assert_eq!(stats_after_food.dogs_vaccinated, 0);

    // --- Act (Record Vaccination Expense) ---
    let mut vacc_dogs = Vec::new(&env);
    vacc_dogs.push_back(dog1_id); // Only one dog vaccinated this time

    let expense2_id = client.record_expense(
        &feeder_addr,
        &300,
        &String::from_str(&env, "Vaccination"),
        &String::from_str(&env, "Annual shots"),
        &String::from_str(&env, "ipfs://hash2"),
        &vacc_dogs,
    );

    // --- Assert (Vaccination Expense) ---
    assert_eq!(expense2_id, 2);
    let feeder_profile_2 = client.get_feeder(&feeder_id);
    assert_eq!(feeder_profile_2.total_spent, 1300); // 1000 + 300

    let stats_after_vacc = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats_after_vacc.dogs_fed, 2); // Unchanged
    assert_eq!(stats_after_vacc.dogs_vaccinated, 1); // Incremented by 1
    assert_eq!(stats_after_vacc.dogs_spayed, 0);
    assert_eq!(stats_after_vacc.dogs_neutered, 0);
    assert_eq!(stats_after_vacc.dogs_treated, 0);
}

#[test]
fn test_treatment_record() {
    // --- Arrange ---
    let (env, client, _admin, _token_id, _token_client) = setup_test();
    let feeder_addr = Address::random(&env);
    let feeder_id = client.register_feeder(
        &feeder_addr,
        &String::from_str(&env, "Feeder"),
        &String::from_str(&env, "Individual"),
        &String::from_str(&env, "City"),
        &String::from_str(&env, "N/A"),
        &String::from_str(&env, "feeder@mail.com"),
    );

    let dog_id = client.register_dog(
        &feeder_addr,
        &String::from_str(&env, "Buddy"),
        &3,
        &String::from_str(&env, "Lab"),
        &String::from_str(&env, "Shelter"),
        &String::from_str(&env, "Sick"),
        &String::from_str(&env, "Parvovirus"),
    );

    let stats_before = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats_before.dogs_rescued, 1);
    assert_eq!(stats_before.dogs_treated, 0);

    // --- Act ---
    let treatment_id = client.record_treatment(
        &feeder_addr,
        &dog_id,
        &String::from_str(&env, "Parvovirus Treatment"),
        &String::from_str(&env, "IV fluids and medication"),
        &500,
        &String::from_str(&env, "Dr. Vet"),
        &String::from_str(&env, "Ongoing"),
    );

    // --- Assert ---
    assert_eq!(treatment_id, 1);
    let treatment = client.get_treatment(&treatment_id);
    assert_eq!(treatment.dog_id, dog_id);
    assert_eq!(treatment.cost, 500);
    assert_eq!(
        treatment.veterinarian,
        String::from_str(&env, "Dr. Vet")
    );

    // Check if stats were updated
    let stats_after = client.get_feeder_stats(&feeder_id);
    assert_eq!(stats_after.dogs_rescued, 1);
    assert_eq!(stats_after.dogs_treated, 1); // Incremented
}