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
import { useDogs } from "@/hooks/useDogs";
import { walletManager } from "@/lib/stellar/wallet";
import { Loader2 } from "lucide-react";

const dogSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  age: z.coerce.number().min(0, "Age must be positive").max(25, "Age too high"),
  breed: z.string().trim().min(1, "Breed is required").max(100, "Breed too long"),
  location: z.string().trim().min(1, "Location is required").max(200, "Location too long"),
  healthStatus: z.enum(["Healthy", "Sick", "Critical", "Recovering"], {
    required_error: "Health status is required",
  }),
  sickness: z.string().trim().max(500, "Description too long").optional(),
});

type DogFormValues = z.infer<typeof dogSchema>;

interface RegisterDogDialogProps {
  children: React.ReactNode;
}

export default function RegisterDogDialog({ children }: RegisterDogDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  
  const { registerDog, loading: hookLoading, refetch } = useDogs();

  const form = useForm<DogFormValues>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: "",
      age: 0,
      breed: "",
      location: "",
      healthStatus: "Healthy",
      sickness: "",
    },
  });

  const onSubmit = async (data: DogFormValues) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Connect wallet
      toast.info("Connecting to Freighter wallet...");
      const address = await walletManager.connectWallet();
      setWalletAddress(address);
      
      // Step 2: Register dog on blockchain
      toast.info("Registering dog on blockchain...");
      
      await registerDog(address, {
        name: data.name,
        age: data.age,
        breed: data.breed,
        location: data.location,
        health_status: data.healthStatus,
        sickness: data.sickness || "None",
      });
      
      // Step 3: Refresh dog list
      await refetch();
      
      // Step 4: Success!
      toast.success("Dog registered successfully!", {
        description: `${data.name} has been added to the blockchain rescue system.`,
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.message?.includes("Freighter")) {
        toast.error("Wallet connection failed", {
          description: "Please install Freighter wallet extension and try again.",
        });
      } else if (error.message?.includes("User declined")) {
        toast.error("Transaction cancelled", {
          description: "You cancelled the transaction in Freighter.",
        });
      } else if (error.message?.includes("not registered")) {
        toast.error("Feeder not registered", {
          description: "You must register as a feeder/NGO first before adding dogs.",
        });
      } else {
        toast.error("Failed to register dog", {
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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Register a Dog</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new dog to the blockchain rescue system
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
                  <FormLabel>Dog Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter dog's name" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
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
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Labrador" 
                        disabled={loading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="City, State" 
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
              name="healthStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select health status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Healthy">Healthy</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Recovering">Recovering</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sickness Details (if applicable)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any health issues..."
                      className="resize-none"
                      rows={3}
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
                    Registering...
                  </>
                ) : (
                  "Register Dog"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}