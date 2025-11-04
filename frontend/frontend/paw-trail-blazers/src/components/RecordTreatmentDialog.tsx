import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { walletManager } from "@/lib/stellar/wallet";
import { stellarClient } from "@/lib/stellar/client";
import * as StellarSdk from '@stellar/stellar-sdk';
import { Loader2 } from "lucide-react";

const treatmentSchema = z.object({
  dogId: z.coerce.number().min(1, "Dog ID is required"),
  treatmentType: z
    .string()
    .trim()
    .min(1, "Treatment type is required")
    .max(100, "Type too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(500, "Description too long"),
  cost: z.coerce.number().min(0, "Cost must be positive").max(100000, "Cost too high"),
  veterinarian: z.string().trim().min(1, "Veterinarian name is required").max(200, "Name too long"),
  outcome: z.enum(["Successful", "Ongoing", "Failed"], {
    required_error: "Outcome is required",
  }),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

interface RecordTreatmentDialogProps {
  children: React.ReactNode;
}

export default function RecordTreatmentDialog({ children }: RecordTreatmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      dogId: 0,
      treatmentType: "",
      description: "",
      cost: 0,
      veterinarian: "",
      outcome: "Ongoing",
    },
  });

  const onSubmit = async (data: TreatmentFormValues) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Connect wallet
      toast.info("Connecting to Freighter wallet...");
      const address = await walletManager.connectWallet();
      setWalletAddress(address);
      
      // Step 2: Record treatment on blockchain
      toast.info("Recording treatment on blockchain...");
      
      // Convert cost to stroops (1 XLM = 10,000,000 stroops)
      const costInStroops = (data.cost * 10000000).toString();
      
      // Prepare contract arguments
      const args = [
        StellarSdk.scVal.scvAddress(StellarSdk.Address.fromString(address)), // feeder address
        StellarSdk.nativeToScVal(data.dogId, { type: 'u64' }),
        StellarSdk.nativeToScVal(data.treatmentType, { type: 'string' }),
        StellarSdk.nativeToScVal(data.description, { type: 'string' }),
        StellarSdk.nativeToScVal(costInStroops, { type: 'i128' }),
        StellarSdk.nativeToScVal(data.veterinarian, { type: 'string' }),
        StellarSdk.nativeToScVal(data.outcome, { type: 'string' })
      ];

      // Create contract operation
      const operation = stellarClient.contract.call('record_treatment', ...args);

      // Build and submit transaction
      const response = await stellarClient.buildAndSubmitTransaction(
        address,
        operation,
        async (tx) => await walletManager.signTransaction(tx.toXDR())
      );

      console.log('Treatment recorded successfully:', response);
      
      // Step 3: Success!
      toast.success("Treatment recorded successfully!", {
        description: "The medical record has been added to the blockchain.",
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Treatment recording error:", error);
      
      if (error.message?.includes("Freighter")) {
        toast.error("Wallet connection failed", {
          description: "Please install Freighter wallet extension and try again.",
        });
      } else if (error.message?.includes("User declined")) {
        toast.error("Transaction cancelled", {
          description: "You cancelled the transaction in Freighter.",
        });
      } else {
        toast.error("Failed to record treatment", {
          description: error.message || "Please try again later.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Record Treatment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Document medical treatment for a rescue dog on blockchain
          </DialogDescription>
        </DialogHeader>

        {walletAddress && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Connected: {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dogId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dog ID</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter dog ID" 
                      disabled={isProcessing}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Type</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Vaccination, Surgery" 
                      disabled={isProcessing}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the treatment..."
                      className="resize-none"
                      rows={3}
                      disabled={isProcessing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (XLM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      disabled={isProcessing}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="veterinarian"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veterinarian Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Dr. Smith, ABC Clinic" 
                      disabled={isProcessing}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Outcome</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isProcessing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Treatment"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}