import { DollarSign } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DonateDialog from "@/components/DonateDialog";

export default function Donations() {
  const donations: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Donations</h2>
          <p className="text-muted-foreground">
            Transparent tracking of all donations on Stellar blockchain
          </p>
        </div>
        <DonateDialog>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Make a Donation
          </Button>
        </DonateDialog>
      </div>

      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Donations Yet"
              description="All donations made through PawChain are recorded on the blockchain for complete transparency."
            />
          ) : (
            <div className="space-y-4">
              {/* Donation records would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
