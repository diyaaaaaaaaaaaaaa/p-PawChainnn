import { Link, useLocation } from "react-router-dom";
import { Heart, Home, Users, DollarSign, Receipt, Activity, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Dogs", href: "/dogs", icon: Heart },
  { name: "Feeders", href: "/feeders", icon: Users },
  { name: "Donations", href: "/donations", icon: DollarSign },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Statistics", href: "/statistics", icon: Activity },
  { name: "Treatments", href: "/treatments", icon: Stethoscope },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(140,40%,92%)] via-[hsl(160,35%,93%)] to-[hsl(345,50%,92%)]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PawChain
                </h1>
                <p className="text-xs text-muted-foreground">Transparent Dog Rescue on Stellar</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-border sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 scrollbar-hide">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            PawChain - Transparent Dog Rescue on Stellar Blockchain
          </p>
        </div>
      </footer>
    </div>
  );
}
