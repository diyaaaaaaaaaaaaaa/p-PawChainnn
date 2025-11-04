import { Receipt } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecordExpenseDialog from "@/components/RecordExpenseDialog";

export default function Expenses() {
  const expenses: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Expense Records</h2>
          <p className="text-muted-foreground">
            Transparent tracking of how donations are spent
          </p>
        </div>
        <RecordExpenseDialog>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Record Expense
          </Button>
        </RecordExpenseDialog>
      </div>

      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Expenses Recorded Yet"
              description="Feeders can record expenses with receipts to show donors exactly how funds are being used."
            />
          ) : (
            <div className="space-y-4">
              {/* Expense records would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
