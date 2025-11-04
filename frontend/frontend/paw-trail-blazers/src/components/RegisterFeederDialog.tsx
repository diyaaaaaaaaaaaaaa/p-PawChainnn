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
import { useFeeders } from "@/hooks/useFeeders";
import { walletManager } from "@/lib/stellar/wallet";
import { Loader2 } from "lucide-react";

const feederSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  organizationType: z.enum(["Individual", "NGO", "Charity", "Shelter"], {
    required_error: "Organization type is required",
  }),
  location: z.string().trim().min(1, "Location is required").max(200, "Location too long"),
  registrationNumber: z.string().trim().max(100, "Registration number too long").optional(),
  contactInfo: z.string().trim().min(1, "Contact info is required").max(200, "Contact info too long"),
});

type FeederFormValues = z.infer<typeof feederSchema>;

interface RegisterFeederDialogProps {
  children: React.ReactNode;
}

export default function RegisterFeederDialog({ children }: RegisterFeederDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  
  const { registerFeeder, loading: hookLoading, refetch } = useFeeders();

  const form = useForm<FeederFormValues>({
    resolver: zodResolver(feederSchema),
    defaultValues: {
      name: "",
      organizationType: "Individual",
      location: "",
      registrationNumber: "",
      contactInfo: "",
    },
  });

  const onSubmit = async (data: FeederFormValues) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Connect wallet
      toast.info("Connecting to Freighter wallet...");
      const address = await walletManager.connectWallet();
      setWalletAddress(address);
      
      // Step 2: Register feeder on blockchain
      toast.info("Registering feeder/NGO on blockchain...");
      
      await registerFeeder(address, {
        name: data.name,
        organization_type: data.organizationType,
        location: data.location,
        registration_number: data.registrationNumber || "N/A",
        contact_info: data.contactInfo,
      });
      
      // Step 3: Refresh feeder list
      await refetch();
      
      // Step 4: Success!
      toast.success("Feeder registered successfully!", {
        description: `${data.name} has been registered on the blockchain. You can now add dogs and receive donations.`,
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Feeder registration error:", error);
      
      if (error.message?.includes("Freighter")) {
        toast.error("Wallet connection failed", {
          description: "Please install Freighter wallet extension and try again.",
        });
      } else if (error.message?.includes("User declined")) {
        toast.error("Transaction cancelled", {
          description: "You cancelled the transaction in Freighter.",
        });
      } else if (error.message?.includes("already registered")) {
        toast.error("Already registered", {
          description: "This wallet address is already registered as a feeder.",
        });
      } else {
        toast.error("Failed to register feeder", {
          description: error.message || "Please check your wallet and try again.",
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
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Register as Feeder/NGO
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Register your organization on the blockchain to manage dogs and receive donations
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization/Individual Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter name" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Individual">Individual Feeder</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Charity">Charity</SelectItem>
                      <SelectItem value="Shelter">Animal Shelter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="City, State, Country" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Official registration number" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    For NGOs/Charities: official registration or tax ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Email, phone, or website..."
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800">
                <strong>Note:</strong> Your wallet address will be permanently linked to this feeder account. 
                Make sure you're using the correct wallet.
              </p>
            </div>

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
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}