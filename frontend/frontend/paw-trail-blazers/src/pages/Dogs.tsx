import { Heart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegisterDogDialog from "@/components/RegisterDogDialog";

export default function Dogs() {
  // In a real app, this would fetch from blockchain
  const dogs: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Registered Dogs</h2>
          <p className="text-muted-foreground">
            All dogs registered in the rescue system
          </p>
        </div>
        <RegisterDogDialog>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Register New Dog
          </Button>
        </RegisterDogDialog>
      </div>

      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Dog Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {dogs.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No Dogs Registered Yet"
              description="Register dogs in the rescue system to track their health, treatments, and adoption status."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dog cards would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
