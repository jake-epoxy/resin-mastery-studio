import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
const Index = lazy(() => import("./pages/Index"));
const LegalTerms = lazy(() => import("./components/LegalTerms"));
const LicensingPage = lazy(() => import("./pages/LicensingPage"));
const QuoteViewLive = lazy(() => import("./pages/QuoteViewLive"));
const BookingLive = lazy(() => import("./pages/BookingLive"));
const PortfolioGallery = lazy(() => import("./pages/PortfolioGallery"));
const LeadCaptureWidget = lazy(() => import("./pages/LeadCaptureWidget"));
const ReviewPortal = lazy(() => import("./pages/ReviewPortal"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget"));
const AffiliateLanding = lazy(() => import("./pages/AffiliateLanding"));
const PartnershipAgreement = lazy(() => import("./components/PartnershipAgreement"));
const FoundingPartnerAgreement = lazy(() => import("./components/FoundingPartnerAgreement"));
const JakeEpoxyLanding = lazy(() => import("./pages/JakeEpoxyLanding"));
const JakeMentorshipPromo = lazy(() => import("./pages/JakeMentorshipPromo"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const QuoteGenerator = lazy(() => import("./pages/admin/QuoteGenerator"));
const Academy = lazy(() => import("./pages/admin/Academy"));
const Marketplace = lazy(() => import("./pages/admin/Marketplace"));
const MasterControl = lazy(() => import("./pages/admin/MasterControl"));
const LeadCenter = lazy(() => import("./pages/admin/LeadCenter"));
const Visualizer = lazy(() => import("./pages/admin/Visualizer"));
const Autopilot = lazy(() => import("./pages/admin/Autopilot"));
const OperationsHub = lazy(() => import("./pages/admin/OperationsHub"));
const WorkforceHub = lazy(() => import("./pages/admin/WorkforceHub"));
const Billing = lazy(() => import("./pages/admin/Billing"));
const CloneOS = lazy(() => import("./pages/admin/CloneOS"));
const ProposalsLibrary = lazy(() => import("./pages/admin/ProposalsLibrary"));
const AdminBanking = lazy(() => import("./pages/admin/AdminBanking"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const EpoxyBrain = lazy(() => import("./pages/admin/EpoxyBrain"));
const FieldLayout = lazy(() => import("./pages/field/FieldLayout"));
const MobileSchedule = lazy(() => import("./pages/field/MobileSchedule"));
const AssistantFAB = lazy(() => import("./components/AssistantFAB"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading Resin OS...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/jakeepoxy" element={<JakeEpoxyLanding />} />
          <Route path="/launchpad" element={<JakeMentorshipPromo />} />
          <Route path="/legal" element={<LegalTerms />} />
          <Route path="/privacy" element={<LegalTerms />} />
          <Route path="/licensing" element={<LicensingPage />} />
          <Route path="/quote-live/:id" element={<QuoteViewLive />} />
          <Route path="/student-onboarding" element={<StudentOnboarding />} />
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
          </Suspense>
        </ErrorBoundary>

        {/* Global Assistant Nav/Chatbot visible everywhere EXCEPT on end-client URLs like quote-live */}
        <Suspense fallback={null}><AssistantFAB /></Suspense>
      </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
