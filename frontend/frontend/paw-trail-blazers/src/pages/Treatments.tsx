import { Stethoscope } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecordTreatmentDialog from "@/components/RecordTreatmentDialog";

export default function Treatments() {
  const treatments: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Treatment Records</h2>
          <p className="text-muted-foreground">
            Medical treatment history for all rescue dogs
          </p>
        </div>
        <RecordTreatmentDialog>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Record Treatment
          </Button>
        </RecordTreatmentDialog>
      </div>

      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">All Treatments</CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No Treatments Recorded Yet"
              description="Medical treatments, vaccinations, and veterinary care will be recorded here for complete transparency."
            />
          ) : (
            <div className="space-y-4">
              {/* Treatment records would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
