import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LegalTerms from "./components/LegalTerms";
import LicensingPage from "./pages/LicensingPage";
import QuoteViewLive from "./pages/QuoteViewLive";
import BookingLive from "./pages/BookingLive";
import PortfolioGallery from "./pages/PortfolioGallery";
import LeadCaptureWidget from "./pages/LeadCaptureWidget";
import ReviewPortal from "./pages/ReviewPortal";
import EmbedWidget from "./pages/EmbedWidget";
import AffiliateLanding from "./pages/AffiliateLanding";
import PartnershipAgreement from "./components/PartnershipAgreement";
import FoundingPartnerAgreement from "./components/FoundingPartnerAgreement";
import JakeEpoxyLanding from "./pages/JakeEpoxyLanding";
import JakeMentorshipPromo from "./pages/JakeMentorshipPromo";

// SaaS Admin Routes
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import QuoteGenerator from "./pages/admin/QuoteGenerator";
import Academy from "./pages/admin/Academy";
import Marketplace from "./pages/admin/Marketplace";
import MasterControl from "./pages/admin/MasterControl";
import LeadCenter from "./pages/admin/LeadCenter";
import Visualizer from "./pages/admin/Visualizer";
import Autopilot from "./pages/admin/Autopilot";
import OperationsHub from "./pages/admin/OperationsHub";
import WorkforceHub from "./pages/admin/WorkforceHub";
import Billing from "./pages/admin/Billing";
import CloneOS from "./pages/admin/CloneOS";
import ProposalsLibrary from "./pages/admin/ProposalsLibrary";
import AdminBanking from "./pages/admin/AdminBanking";
import SettingsPage from "./pages/admin/SettingsPage";
import EpoxyBrain from "./pages/admin/EpoxyBrain";
import FieldLayout from "./pages/field/FieldLayout";
import MobileSchedule from "./pages/field/MobileSchedule";

import AssistantFAB from "./components/AssistantFAB";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/jakeepoxy" element={<JakeEpoxyLanding />} />
          <Route path="/launchpad" element={<JakeMentorshipPromo />} />
          <Route path="/legal" element={<LegalTerms />} />
          <Route path="/privacy" element={<LegalTerms />} />
          <Route path="/licensing" element={<LicensingPage />} />
          <Route path="/quote-live/:id" element={<QuoteViewLive />} />
          <Route path="/book/:slug" element={<BookingLive />} />
          <Route path="/portfolio/:id" element={<PortfolioGallery />} />
          <Route path="/quote-form/:id" element={<LeadCaptureWidget />} />
          <Route path="/widget/ai/:installerId" element={<EmbedWidget />} />
          <Route path="/review/:id" element={<ReviewPortal />} />
          
          {/* Affiliate Referral Pages */}
          <Route path="/ref/:affiliateSlug" element={<AffiliateLanding />} />
          <Route path="/NikkiGivens" element={<PartnershipAgreement />} />
          <Route path="/JasonWaller" element={<FoundingPartnerAgreement />} />
          
          {/* Admin SaaS Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<LeadCenter />} />
            <Route path="quote" element={<QuoteGenerator />} />
            <Route path="academy" element={<Academy />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="workforce" element={<WorkforceHub />} />
            <Route path="ops" element={<OperationsHub />} />
            <Route path="proposals" element={<ProposalsLibrary />} />
            <Route path="super" element={<MasterControl />} />
            <Route path="clone" element={<CloneOS />} />
            <Route path="visualizer" element={<Visualizer />} />
            <Route path="autopilot" element={<Autopilot />} />
            <Route path="billing" element={<Billing />} />
            <Route path="finances" element={<AdminBanking />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="brain" element={<EpoxyBrain />} />
          </Route>

          {/* Mobile Field App */}
          <Route path="/field" element={<FieldLayout />}>
            <Route index element={<MobileSchedule />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>

        {/* Global Assistant Nav/Chatbot visible everywhere EXCEPT on end-client URLs like quote-live */}
        <AssistantFAB />
      </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
