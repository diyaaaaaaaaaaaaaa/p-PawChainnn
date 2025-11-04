import { Heart, Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterDogDialog from "@/components/RegisterDogDialog";
import RegisterFeederDialog from "@/components/RegisterFeederDialog";
import DonateDialog from "@/components/DonateDialog";

export default function Dashboard() {
  // In a real app, these would come from blockchain data
  const stats = {
    totalDogs: 0,
    totalFeeders: 0,
    totalDonations: 0,
    totalExpenses: 0,
  };

  const hasData = stats.totalDogs > 0 || stats.totalFeeders > 0;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Dogs Registered"
          value={stats.totalDogs}
          icon={Heart}
        />
        <StatCard
          title="Active Feeders/NGOs"
          value={stats.totalFeeders}
          icon={Users}
        />
        <StatCard
          title="Total Donations"
          value={stats.totalDonations}
          icon={DollarSign}
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <EmptyState
              icon={Activity}
              title="No Activity Yet"
              description="Once feeders register and dogs are added, recent activity will appear here."
            />
          ) : (
            <div className="space-y-4">
              {/* Activity items would go here */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RegisterDogDialog>
          <Card className="border-border/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Register a Dog</h3>
              <p className="text-sm text-muted-foreground">Add a new dog to the rescue system</p>
            </CardContent>
          </Card>
        </RegisterDogDialog>

        <DonateDialog>
          <Card className="border-border/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Make a Donation</h3>
              <p className="text-sm text-muted-foreground">Support dog rescue efforts</p>
            </CardContent>
          </Card>
        </DonateDialog>

        <RegisterFeederDialog>
          <Card className="border-border/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Register as Feeder</h3>
              <p className="text-sm text-muted-foreground">Join as an NGO or individual feeder</p>
            </CardContent>
          </Card>
        </RegisterFeederDialog>
      </div>
    </div>
  );
}
