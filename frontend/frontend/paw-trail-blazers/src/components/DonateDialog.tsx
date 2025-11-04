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
  FormDescription,
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
import { useDonations } from "@/hooks/useDonations";
import { walletManager } from "@/lib/stellar/wallet";
import { Loader2 } from "lucide-react";

const donationSchema = z.object({
  feederId: z.coerce.number().min(1, "Please select a feeder"),
  amount: z.coerce
    .number()
    .min(1, "Amount must be greater than 0")
    .max(1000000, "Amount too large"),
  purpose: z.enum(["General", "Specific Dog", "Emergency", "Vaccination", "Treatment"], {
    required_error: "Purpose is required",
  }),
  dogId: z.coerce.number().optional(),
  notes: z.string().trim().max(500, "Notes too long").optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonateDialogProps {
  children: React.ReactNode;
}

export default function DonateDialog({ children }: DonateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  
  const { makeDonation, loading: hookLoading } = useDonations();

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      feederId: 0,
      amount: 0,
      purpose: "General",
      dogId: undefined,
      notes: "",
    },
  });

  const watchPurpose = form.watch("purpose");

  const onSubmit = async (data: DonationFormValues) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Connect wallet
      toast.info("Connecting to Freighter wallet...");
      const address = await walletManager.connectWallet();
      setWalletAddress(address);
      
      // Step 2: Make donation on blockchain
      toast.info("Preparing transaction...");
      
      // Convert XLM to stroops (1 XLM = 10,000,000 stroops)
      const amountInStroops = (data.amount * 10000000).toString();
      
      await makeDonation(
        address,
        data.feederId,
        amountInStroops,
        data.purpose,
        data.dogId
      );
      
      // Step 3: Success!
      toast.success("Donation successful!", {
        description: `Thank you for donating ${data.amount} XLM! Transaction recorded on Stellar blockchain.`,
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Donation error:", error);
      
      if (error.message?.includes("Freighter")) {
        toast.error("Wallet connection failed", {
          description: "Please install Freighter wallet extension and try again.",
        });
      } else if (error.message?.includes("User declined")) {
        toast.error("Transaction cancelled", {
          description: "You cancelled the transaction in Freighter.",
        });
      } else {
        toast.error("Donation failed", {
          description: error.message || "Please check your wallet balance and try again.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = isProcessing || hookLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Make a Donation</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Support dog rescue efforts with a transparent donation on Stellar blockchain
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
              name="feederId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Feeder/NGO</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="1">Example Feeder 1</SelectItem>
                      <SelectItem value="2">Example Feeder 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Select a verified feeder or NGO to receive your donation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (XLM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Minimum transaction fee: ~0.01 XLM
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="General">General Fund</SelectItem>
                      <SelectItem value="Specific Dog">Specific Dog</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Treatment">Medical Treatment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPurpose === "Specific Dog" && (
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
                        disabled={loading}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter the ID of the dog you want to support
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a message..."
                      className="resize-none"
                      rows={2}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Donate"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}