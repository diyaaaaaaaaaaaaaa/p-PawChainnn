/* src/lib/stellar/wallet.ts */
import { isConnected, requestAccess, getPublicKey, signTransaction } from "@stellar/freighter-api";

/**
 * Minimal Wallet manager using Freighter's API.
 * Exports walletManager with:
 * - isWalletConnected()
 * - connectWallet()
 * - signTransaction(xdr)
 */

const STELLAR_CONFIG = {
  networkPassphrase: String(import.meta.env.VITE_STELLAR_NETWORK).toLowerCase().includes("future")
    ? String(import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015")
    : String(import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015"),
};

export class WalletManager {
  async isWalletConnected(): Promise<boolean> {
    try {
      return await isConnected();
    } catch {
      return false;
    }
  }

  async connectWallet(): Promise<string> {
    const installed = await this.isWalletConnected();
    if (!installed) {
      throw new Error("Freighter wallet not detected. Please install or open it.");
    }

    // Ask for permission (prompts user)
    try {
      await requestAccess();
    } catch (err) {
      console.error("Freighter requestAccess rejected:", err);
      throw new Error("Freighter connection denied by user");
    }

    // Get public key
    try {
      const pub = await getPublicKey();
      if (!pub) throw new Error("Freighter returned empty public key");
      return pub;
    } catch (err) {
      console.error("getPublicKey failed:", err);
      throw err;
    }
  }

  async signTransaction(xdr: string): Promise<string> {
    try {
      // freighter signTransaction expects XDR string + options
      const signed = await signTransaction(xdr, {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });
      return signed;
    } catch (err) {
      console.error("Freighter signTransaction failed:", err);
      throw err;
    }
  }
}

export const walletManager = new WalletManager();
