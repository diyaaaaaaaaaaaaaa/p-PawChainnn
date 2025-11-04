import * as StellarSdk from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './config';

export class StellarClient {
  private server: StellarSdk.SorobanRpc.Server;
  public contract: StellarSdk.Contract;

  constructor() {
    this.server = new StellarSdk.SorobanRpc.Server(STELLAR_CONFIG.rpcUrl);
    this.contract = new StellarSdk.Contract(STELLAR_CONFIG.contractId);
  }

  // Get account details
  async getAccount(publicKey: string) {
    try {
      return await this.server.getAccount(publicKey);
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  // Invoke contract method (read-only) - FOR PRODUCTION USE
  async invokeContractMethod(method: string, params: StellarSdk.xdr.ScVal[] = []) {
    try {
      // For read-only contract calls, we need to simulate with a source account
      // We'll use a temporary keypair just for building the transaction
      const tempKeypair = StellarSdk.Keypair.random();
      
      // Create a temporary account object (not on chain, just for transaction building)
      const sourceAccount = new StellarSdk.Account(tempKeypair.publicKey(), '0');
      
      const operation = this.contract.call(method, ...params);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate the transaction to get the result
      const response = await this.server.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(response)) {
        return StellarSdk.scValToNative(response.result!.retval);
      }
      
      if (StellarSdk.SorobanRpc.Api.isSimulationError(response)) {
        console.error('Simulation error:', response);
        throw new Error(`Simulation failed: ${response.error}`);
      }
      
      throw new Error('Contract invocation failed');
    } catch (error) {
      console.error(`Error invoking ${method}:`, error);
      throw error;
    }
  }

  // Build and submit transaction - FOR REAL TRANSACTIONS
  async buildAndSubmitTransaction(
    sourcePublicKey: string,
    operation: StellarSdk.xdr.Operation,
    signerFunction: (tx: StellarSdk.Transaction) => Promise<string>
  ) {
    try {
      // Get the actual source account from the blockchain
      const sourceAccount = await this.getAccount(sourcePublicKey);
      
      // Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      console.log('Simulating transaction...');
      
      // Simulate transaction first
      const simulationResponse = await this.server.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationError(simulationResponse)) {
        console.error('Simulation error:', simulationResponse);
        throw new Error(`Simulation failed: ${simulationResponse.error}`);
      }

      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
        throw new Error('Simulation was not successful');
      }

      console.log('Simulation successful, preparing transaction...');

      // Prepare transaction from simulation (adds auth and resource fees)
      const preparedTransaction = StellarSdk.SorobanRpc.assembleTransaction(
        transaction,
        simulationResponse
      ).build();

      console.log('Transaction prepared, requesting signature...');

      // Sign transaction using Freighter wallet
      const signedXdr = await signerFunction(preparedTransaction);
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        STELLAR_CONFIG.networkPassphrase
      ) as StellarSdk.Transaction;

      console.log('Transaction signed, submitting to network...');

      // Submit the signed transaction to the network
      const sendResponse = await this.server.sendTransaction(signedTx);
      
      console.log('Transaction submitted:', sendResponse);

      if (sendResponse.status === 'PENDING') {
        console.log('Transaction pending, polling for result...');
        return await this.pollTransactionStatus(sendResponse.hash);
      }

      if (sendResponse.status === 'ERROR') {
        throw new Error(`Transaction error: ${JSON.stringify(sendResponse)}`);
      }

      throw new Error(`Unexpected transaction status: ${sendResponse.status}`);
    } catch (error) {
      console.error('Error building/submitting transaction:', error);
      throw error;
    }
  }

  // Poll transaction status until complete
// Replace the existing method in StellarClient with this implementation
private async pollTransactionStatus(hash: string, maxAttempts = 30, delayMs = 4000) {
  console.log(`Polling transaction ${hash}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // wait between attempts except the first
    if (attempt > 1) {
      await new Promise((res) => setTimeout(res, delayMs));
    }

    try {
      // Try to fetch the full transaction status/result from the Soroban RPC.
      // Note: getTransaction may sometimes throw if the RPC hasn't produced a
      // final decodable result yet (this is where "Bad union switch: 4" can happen).
      const txResponse = await this.server.getTransaction(hash);

      console.log(`Attempt ${attempt}: got transaction response. status=${txResponse.status}`);

      // If Soroban returned a final status, act on it
      if (txResponse.status === "SUCCESS") {
        console.log("Transaction successful!", txResponse);
        return txResponse;
      }

      if (txResponse.status === "FAILED") {
        console.error("Transaction failed:", txResponse);
        throw new Error(`Transaction failed: ${JSON.stringify(txResponse)}`);
      }

      // If status is NOT_FOUND or PENDING or other non-final state, keep polling
      console.log(`Attempt ${attempt}: transaction status is ${txResponse.status} (waiting).`);
    } catch (err: any) {
      // Common decoding error when calling getTransaction too early:
      // "TypeError: Bad union switch: 4" (or other parsing errors)
      // We'll log and continue polling; don't treat as fatal yet.
      //
      // If the error looks like a genuine network / permission error, rethrow.
      const message = err?.message ?? String(err);
      console.log(`Attempt ${attempt} polling error (will retry):`, message);

      // If it's clearly an fatal network or auth error, throw immediately:
      if (
        message.includes("ENOTFOUND") ||
        message.includes("network") ||
        message.includes("403") ||
        message.includes("401") ||
        message.includes("permission")
      ) {
        // Re-throw for these cases
        console.error("Network/auth error while polling transaction:", err);
        throw err;
      }

      // otherwise continue polling (we expect transient parse/timing errors)
    }
  }

  throw new Error(`Transaction timeout after ${maxAttempts} attempts. Hash: ${hash}`);
}

  // Helper: Convert contract data to native JavaScript types
  scValToNative(scVal: StellarSdk.xdr.ScVal): any {
    return StellarSdk.scValToNative(scVal);
  }
}

export const stellarClient = new StellarClient();


