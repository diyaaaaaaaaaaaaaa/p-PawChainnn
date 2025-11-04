import { Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegisterFeederDialog from "@/components/RegisterFeederDialog";

export default function Feeders() {
  const feeders: any[] = [];

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
          {feeders.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Feeders Registered Yet"
              description="NGOs, shelters, and individual feeders can register to manage dog rescues and receive donations."
            />
          ) : (
            <div className="space-y-4">
              {/* Feeder cards would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
