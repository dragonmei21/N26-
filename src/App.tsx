import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationBanner from "@/components/NotificationBanner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Home from "./pages/Index";
import Finances from "./pages/Finances";
import Investments from "./pages/Investments";
import Benefits from "./pages/Benefits";
import Cards from "./pages/Cards";
import Scenarios from "./pages/Scenarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NotificationProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationBanner />
      <BrowserRouter>
        <div className="max-w-md mx-auto relative min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </NotificationProvider>
  </QueryClientProvider>
);

export default App;
