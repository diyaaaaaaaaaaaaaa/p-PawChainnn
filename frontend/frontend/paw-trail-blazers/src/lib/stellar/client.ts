/* src/lib/stellar/client.ts */
import * as StellarSdk from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "./config";

/**
 * StellarClient — wrapper around Soroban RPC + contract operations
 * - robust polling that tolerates "Bad union switch" / decode timing errors
 * - simulation -> prepare -> sign -> send flow with a raw RPC fallback
 */

export class StellarClient {
  private server: StellarSdk.SorobanRpc.Server;
  public contract: StellarSdk.Contract;

  constructor() {
    this.server = new StellarSdk.SorobanRpc.Server(STELLAR_CONFIG.rpcUrl);
    this.contract = new StellarSdk.Contract(STELLAR_CONFIG.contractId);
  }

  async getAccount(publicKey: string) {
    try {
      return await this.server.getAccount(publicKey);
    } catch (error) {
      console.error("Error fetching account:", error);
      throw error;
    }
  }

  // Read-only contract invocation using simulation
  async invokeContractMethod(method: string, params: StellarSdk.xdr.ScVal[] = []) {
    try {
      const tempKeypair = StellarSdk.Keypair.random();
      const sourceAccount = new StellarSdk.Account(tempKeypair.publicKey(), "0");

      const operation = this.contract.call(method, ...params);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const response = await this.server.simulateTransaction(transaction);

      // NOTE: Use the SDK helpers if available
      if ((StellarSdk as any).SorobanRpc && (StellarSdk as any).SorobanRpc.Api) {
        const Api = (StellarSdk as any).SorobanRpc.Api;
        if (Api.isSimulationSuccess(response)) {
          return StellarSdk.scValToNative(response.result!.retval);
        }
        if (Api.isSimulationError(response)) {
          console.error("Simulation error:", response);
          throw new Error(`Simulation failed: ${JSON.stringify(response)}`);
        }
      }

      // Fallback: try to inspect raw response
      if ((response as any)?.result?.retval) {
        return StellarSdk.scValToNative((response as any).result.retval);
      }

      throw new Error("Contract invocation failed (unknown simulation response)");
    } catch (error) {
      console.error(`Error invoking ${method}:`, error);
      throw error;
    }
  }

  // Build, prepare (simulation), request signature, and submit to network.
  async buildAndSubmitTransaction(
    sourcePublicKey: string,
    operation: StellarSdk.xdr.Operation,
    signerFunction: (tx: StellarSdk.Transaction) => Promise<string>
  ) {
    try {
      const sourceAccount = await this.getAccount(sourcePublicKey);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      console.log("Simulating transaction...");
      const simulationResponse = await this.server.simulateTransaction(transaction);

      // If simulation reports an error, throw early
      if ((StellarSdk as any).SorobanRpc?.Api?.isSimulationError?.(simulationResponse)) {
        console.error("Simulation error:", simulationResponse);
        throw new Error(`Simulation failed: ${JSON.stringify(simulationResponse)}`);
      }

      if (!(StellarSdk as any).SorobanRpc?.Api?.isSimulationSuccess?.(simulationResponse)) {
        // If SDK doesn't have helpers, try fallback check
        if (!(simulationResponse as any)?.result) {
          throw new Error("Simulation was not successful (no result returned).");
        }
      }

      console.log("Simulation successful, preparing transaction...");

      // Assemble transaction (set footprint, fees)
      let preparedTransaction: StellarSdk.Transaction;
      try {
        preparedTransaction = (StellarSdk as any).SorobanRpc.assembleTransaction(
          transaction,
          simulationResponse
        ).build();
      } catch (err) {
        console.error("assembleTransaction failed:", err);
        // If assembleTransaction isn't available or fails, try using the original transaction.
        // It's better to attempt sign + send than to fail completely in dev/test.
        preparedTransaction = transaction;
      }

      console.log("Transaction prepared, requesting signature...");

      // signerFunction may expect Transaction or XDR string; support both.
      const signedXdr = await signerFunction(preparedTransaction);
      if (!signedXdr || typeof signedXdr !== "string") {
        throw new Error("signerFunction did not return a signed XDR string");
      }

      // Convert signed XDR to Transaction object
      let signedTx: StellarSdk.Transaction;
      try {
        signedTx = StellarSdk.TransactionBuilder.fromXDR(
          signedXdr,
          STELLAR_CONFIG.networkPassphrase
        ) as StellarSdk.Transaction;
      } catch (err) {
        // If parsing fails, try to send raw XDR via RPC fallback
        console.warn("Failed to parse signedXdr into Transaction object:", err);
        return await this.sendRawXdrFallback(signedXdr);
      }

      console.log("Transaction signed, submitting to network...");

      // Primary path: SDK sendTransaction
      try {
        const sendResponse = await this.server.sendTransaction(signedTx);
        console.log("sendResponse (SDK):", sendResponse);

        if ((sendResponse as any)?.status === "PENDING") {
          return await this.pollTransactionStatus((sendResponse as any).hash, parseInt(process.env.VITE_MAX_RETRIES || "60"), 4000);
        } else if ((sendResponse as any)?.status === "ERROR") {
          throw new Error(`Transaction error: ${JSON.stringify(sendResponse)}`);
        } else {
          // some RPCs return full object immediately
          return sendResponse;
        }
      } catch (sdkSendErr) {
        console.warn("SDK sendTransaction threw, trying RPC fallback:", sdkSendErr);
        // fallback: send via raw RPC
        return await this.sendRawXdrFallback(signedXdr);
      }
    } catch (error) {
      console.error("Error building/submitting transaction:", error);
      throw error;
    }
  }

  // Send signed XDR via JSON-RPC fallback to the Soroban server.
  private async sendRawXdrFallback(signedXdr: string) {
    try {
      const rpcUrl = STELLAR_CONFIG.rpcUrl;
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "send_transaction",
          params: { tx: signedXdr },
        }),
      });
      const raw = await res.json();
      console.log("RPC fallback response:", raw);

      // If raw.result exists and indicates PENDING, poll the hash
      const hash = raw?.result?.hash || raw?.result?.id || raw?.hash;
      const status = raw?.result?.status || raw?.status;

      if (status === "PENDING" && hash) {
        return await this.pollTransactionStatus(hash, parseInt(process.env.VITE_MAX_RETRIES || "60"), 4000);
      }

      if (status === "ERROR") {
        throw new Error(`RPC send_transaction error: ${JSON.stringify(raw)}`);
      }

      return raw;
    } catch (err) {
      console.error("RPC fallback send failed:", err);
      throw err;
    }
  }

  // Poll transaction status — tolerant of transient decode errors like "Bad union switch"
  private async pollTransactionStatus(hash: string, maxAttempts = 30, delayMs = 4000) {
    console.log(`Polling transaction ${hash}... (maxAttempts=${maxAttempts})`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        const txResponse = await this.server.getTransaction(hash);

        console.log(`Attempt ${attempt}: got transaction response. status=${txResponse.status}`);

        if (txResponse.status === "SUCCESS") {
          return txResponse;
        }
        if (txResponse.status === "FAILED") {
          throw new Error(`Transaction failed: ${JSON.stringify(txResponse)}`);
        }

        // NOT_FOUND or PENDING -> continue polling
        console.log(`Attempt ${attempt}: transaction status is ${txResponse.status} (waiting).`);
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.log(`Attempt ${attempt} polling error (will retry):`, msg);

        // treat known XDR parse timing errors as transient (retry)
        if (msg.includes("Bad union switch") || msg.includes("union switch") || msg.includes("invalid XDR") || msg.includes("unexpected")) {
          // transient: continue to next attempt
          continue;
        }

        // network/auth errors -> bail out
        if (msg.includes("ENOTFOUND") || msg.includes("403") || msg.includes("401") || msg.includes("permission") || msg.includes("network")) {
          console.error("Network/auth error while polling transaction:", err);
          throw err;
        }

        // other errors: log and continue (tolerant)
        console.warn("Polling got unknown error (retrying):", err);
      }
    }

    throw new Error(`Transaction timeout after ${maxAttempts} attempts. Hash: ${hash}`);
  }

  scValToNative(scVal: StellarSdk.xdr.ScVal): any {
    return StellarSdk.scValToNative(scVal);
  }
}

export const stellarClient = new StellarClient();
