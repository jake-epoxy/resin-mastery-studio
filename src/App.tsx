import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LegalTerms from "./components/LegalTerms";
import LicensingPage from "./pages/LicensingPage";
import QuoteViewLive from "./pages/QuoteViewLive";

// SaaS Admin Routes
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import QuoteGenerator from "./pages/admin/QuoteGenerator";
import Academy from "./pages/admin/Academy";
import Marketplace from "./pages/admin/Marketplace";
import MasterControl from "./pages/admin/MasterControl";
import LeadCenter from "./pages/admin/LeadCenter";
import Visualizer from "./pages/admin/Visualizer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/legal" element={<LegalTerms />} />
          <Route path="/privacy" element={<LegalTerms />} />
          <Route path="/licensing" element={<LicensingPage />} />
          <Route path="/quote-live/:id" element={<QuoteViewLive />} />
          
          {/* Admin SaaS Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<LeadCenter />} />
            <Route path="quote" element={<QuoteGenerator />} />
            <Route path="academy" element={<Academy />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="super" element={<MasterControl />} />
            <Route path="visualizer" element={<Visualizer />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
