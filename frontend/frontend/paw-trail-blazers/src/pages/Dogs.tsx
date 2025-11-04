import { Heart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegisterDogDialog from "@/components/RegisterDogDialog";
import { useDogs } from "@/hooks/useDogs"; // ✅ Import your hook
import { Loader2 } from "lucide-react";

export default function Dogs() {
  const { dogs, loading, error, refetch } = useDogs(); // ✅ Use the hook

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Registered Dogs
          </h2>
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
          <CardTitle className="text-xl font-bold text-foreground">
            Dog Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
              <span className="ml-2 text-muted-foreground">Fetching dogs from blockchain...</span>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : dogs.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No Dogs Registered Yet"
              description="Register dogs in the rescue system to track their health, treatments, and adoption status."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogs.map((dog) => (
                <Card
                  key={dog.dog_id}
                  className="border border-border/30 p-4 rounded-xl shadow-sm hover:shadow-md transition"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{dog.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Breed:</strong> {dog.breed}</p>
                    <p><strong>Age:</strong> {dog.age}</p>
                    <p><strong>Health:</strong> {dog.health_status}</p>
                    <p><strong>Sickness:</strong> {dog.sickness || "None"}</p>
                    <p><strong>Location:</strong> {dog.location}</p>
                    <p><strong>Status:</strong> {dog.is_active ? "Active" : "Inactive"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
