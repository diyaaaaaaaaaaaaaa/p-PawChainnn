import {
  isConnected,
  getPublicKey,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";

const STELLAR_CONFIG = {
  networkPassphrase: "Test SDF Network ; September 2015",
};

export class WalletManager {
  // Check if Freighter wallet is installed and connected
  async isWalletConnected(): Promise<boolean> {
    return await isConnected();
  }

  // Connect to Freighter wallet and get user's public key
  async connectWallet(): Promise<string> {
    const isWalletAvailable = await this.isWalletConnected();
    if (typeof window.freighterApi === "undefined") {
        console.warn("Freighter API not yet injected — try refreshing the page.");
    }

    if (!isWalletAvailable) {
      throw new Error("Freighter wallet is not installed. Please install it first.");
    }

    // Request permission to access the wallet
    await requestAccess();

    // Get the public key (wallet address)
    const publicKey = await getPublicKey();
    console.log("Connected wallet:", publicKey);
    return publicKey;
  }

  

  // Sign a transaction XDR using Freighter
  async signTransaction(xdr: string): Promise<string> {
    const signedXdr = await signTransaction(xdr, {
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    });
    console.log("Signed Transaction XDR:", signedXdr);
    return signedXdr;
  }
}

// Export a ready-to-use wallet manager instance
export const walletManager = new WalletManager();
