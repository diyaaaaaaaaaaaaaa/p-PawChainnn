# 🐾 PawChain – Soroban Smart Contract  
### Transparent Dog Rescue Donation System on Stellar Blockchain

---

## 📌 Project Description  
PawChain is a Soroban-based smart contract designed to enable **fully transparent donation tracking** for street dog rescue operations.  
Each donation, expense, treatment, and feeder/NGO profile is stored **on-chain**, ensuring **auditability, accountability, and immutability** without relying on centralized platforms or screenshots as proof.

The contract acts as the **decentralized backend** for PawChain’s donation platform, handling data persistence, authentication, and activity statistics for feeders, dogs, and donors.
<img width="2859" height="1435" alt="image" src="https://github.com/user-attachments/assets/bed02d0c-14e2-4967-9cc5-c4138549e075" />
<img width="2875" height="1439" alt="image" src="https://github.com/user-attachments/assets/50aeb785-8b9f-4a36-9757-aae79c34e6cd" />



---

## 🎯 Project Vision  
✅ Bring **trust and traceability** to animal welfare donations  
✅ Create a **blockchain-powered public ledger** of rescue activity  
✅ Ensure **every donor knows exactly where funds go**  
✅ Empower verified feeders, shelters, and NGOs with **direct, wallet-to-wallet funding**  
✅ Build a scalable model for **global animal rescue transparency**

> The long-term goal is to eliminate donation fraud, enable real humanitarian on-chain reporting, and support thousands of street animals through verifiable public funding.

---

## 🛠 Key Features (Smart Contract)

| Feature | Description |
|---------|-------------|
| 🧾 **On-chain Donation Records** | Every donation is logged with donor address, feeder ID, amount, timestamp, and purpose. |
| 🏢 **Feeder / NGO Registry** | Feeder profiles include wallet, location, organization type, and verification status. |
| 🐶 **Dog Profiles** | Supports tracking rescued dogs, their health status, age, breed, and associated feeder. |
| 💉 **Medical & Expense Tracking** | Adds treatment records, expenses, receipts, and category-based impact stats. |
| 📊 **Activity Statistics** | Tracks dogs fed, vaccinated, treated, spayed, neutered, adopted, etc. |
| 🔐 **Auth-Safe Operations** | Mutating functions require the caller’s on-chain signature via `require_auth()`. |
| 💰 **Token-Ready Architecture** | Supports future integration of XLM or custom token transfers (currently soft-disabled for testing UX). |
| 🧩 **Modular Storage Keys** | Efficient, upgrade-safe storage indexing using `DataKey` enum. |

---

## 🚀 Future Scope  

| Phase | Planned Upgrade |
|-------|-----------------|
| 🔄 **Token Transfer Enablement** | Enable real XLM or asset movement from donor → feeder (currently mocked). |
| 🧾 **IPFS Proof Storage** | Upload rescue photos, medical bills, and receipts with hashed verification. |
| 🌍 **Public Explorer** | A block-scan style UI to browse all donations, dogs, and feeder activity. |
| 🏷 **NFT Dog Identity Tags** | Every rescued dog gets an NFT identity representing its history & adoption proof. |
| 📱 **Mobile Wallet Integrations** | Freighter, Lobstr, and real-time push updates for donors + rescuers. |
| 🎖 **Reputation & Badge Layer** | Gamification for donors + feeders based on verified activity. |
| ⚠️ **Emergency Rescue Signals** | Feeder can flag urgent cases and route funds instantly to treatment. |
| 🤝 **Multi-Donor Campaign Pools** | Group-funding for specific dogs or medical operations. |

---

## 📂 Contract Files

