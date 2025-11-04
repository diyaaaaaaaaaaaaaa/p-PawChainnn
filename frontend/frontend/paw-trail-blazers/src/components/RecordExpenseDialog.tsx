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
import { useExpenses } from "@/hooks/useExpenses";
import { walletManager } from "@/lib/stellar/wallet";
import { Loader2 } from "lucide-react";

const expenseSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(100000, "Amount too large"),
  category: z.enum(["Food", "Vaccination", "Treatment", "Spaying", "Neutering", "Medicine", "Supplies", "Facility"], {
    required_error: "Category is required",
  }),
  description: z.string().trim().min(1, "Description is required").max(500, "Description too long"),
  receiptHash: z.string().trim().optional(),
  dogsAffected: z.string().trim().min(1, "Please specify affected dogs").max(200, "Too long"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface RecordExpenseDialogProps {
  children: React.ReactNode;
}

export default function RecordExpenseDialog({ children }: RecordExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  
  const { recordExpense, loading: hookLoading, refetch } = useExpenses();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: "Food",
      description: "",
      receiptHash: "",
      dogsAffected: "",
    },
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Connect wallet
      toast.info("Connecting to Freighter wallet...");
      const address = await walletManager.connectWallet();
      setWalletAddress(address);
      
      // Step 2: Parse dogs affected (comma-separated IDs)
      const dogIds = data.dogsAffected
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (dogIds.length === 0) {
        toast.error("Invalid dog IDs", {
          description: "Please enter valid dog IDs separated by commas (e.g., 1, 2, 3)",
        });
        return;
      }
      
      // Step 3: Record expense on blockchain
      toast.info("Recording expense on blockchain...");
      
      // Convert XLM to stroops
      const amountInStroops = (data.amount * 10000000).toString();
      
      await recordExpense(address, {
        amount: amountInStroops,
        category: data.category,
        description: data.description,
        receipt_hash: data.receiptHash || "No receipt",
        dogs_affected: dogIds,
      });
      
      // Step 4: Refresh expense list
      await refetch();
      
      // Step 5: Success!
      toast.success("Expense recorded successfully!", {
        description: `Expense of ${data.amount} XLM has been recorded on the blockchain.`,
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Expense recording error:", error);
      
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
          description: "You must be registered as a feeder to record expenses.",
        });
      } else {
        toast.error("Failed to record expense", {
          description: error.message || "Please try again later.",
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
            Record Expense
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Log how donations were spent on the blockchain for transparency
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Spent (XLM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Treatment">Medical Treatment</SelectItem>
                      <SelectItem value="Spaying">Spaying</SelectItem>
                      <SelectItem value="Neutering">Neutering</SelectItem>
                      <SelectItem value="Medicine">Medicine</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Facility">Facility/Shelter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Category affects activity statistics tracking
                  </FormDescription>
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
                      placeholder="Describe the expense..."
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

            <FormField
              control={form.control}
              name="dogsAffected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dogs Affected (IDs)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1, 2, 3" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter dog IDs separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptHash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Hash (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="IPFS hash or receipt reference" 
                      disabled={loading}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload receipt to IPFS and paste hash here for verification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="text-green-800">
                <strong>Transparency:</strong> All expenses are permanently recorded on the blockchain 
                and visible to donors.
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
                    Recording...
                  </>
                ) : (
                  "Record Expense"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}