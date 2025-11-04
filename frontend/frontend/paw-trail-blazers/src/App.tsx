import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Dogs from "./pages/Dogs";
import Feeders from "./pages/Feeders";
import Donations from "./pages/Donations";
import Expenses from "./pages/Expenses";
import Statistics from "./pages/Statistics";
import Treatments from "./pages/Treatments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dogs" element={<Dogs />} />
            <Route path="/feeders" element={<Feeders />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
