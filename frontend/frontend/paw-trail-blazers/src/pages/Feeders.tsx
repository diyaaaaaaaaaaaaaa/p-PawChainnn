import { Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegisterFeederDialog from "@/components/RegisterFeederDialog";
import { useFeeders } from "@/hooks/useFeeders";

export default function Feeders() {
  const { feeders, loading, error, refetch } = useFeeders();
  console.log("Rendering feeders:", feeders);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Feeders & NGOs</h2>
          <p className="text-muted-foreground">
            Organizations and individuals caring for rescue dogs
          </p>
        </div>
        <RegisterFeederDialog>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Register as Feeder
          </Button>
        </RegisterFeederDialog>
      </div>

      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Registered Feeders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
  <p>Loading feeders from blockchain...</p>
) : error ? (
  <p className="text-red-500">{error}</p>
) : feeders.length === 0 ? (
  <EmptyState
    icon={Users}
    title="No Feeders Registered Yet"
    description="NGOs, shelters, and individual feeders can register to manage dog rescues and receive donations."
  />
) : (
  <div className="space-y-4">
    {feeders.map((f, i) => (
      <Card key={i} className="p-4 border border-border/30 bg-white/60 backdrop-blur-sm">
        <h3 className="font-semibold text-lg">{f.name || f[0] || "Unnamed Feeder"}</h3>
        <p className="text-sm text-muted-foreground">
          Wallet: {f.wallet_address || f[1] || "Unknown"}
        </p>
        <p className="text-sm text-muted-foreground">
          Location: {f.location || f[2] || "Not specified"}
        </p>
      </Card>
    ))}
  </div>
)}

        </CardContent>
      </Card>
    </div>
  );
}
