import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExamplesPage from "./pages/ExamplesPage";
import PricingPage from "./pages/PricingPage";
import TemplatesPage from "./pages/TemplatesPage";
import DashboardPage from "./pages/app/DashboardPage";
import CharactersPage from "./pages/app/CharactersPage";
import CharacterDetailPage from "./pages/app/CharacterDetailPage";
import CharacterCreatePage from "./pages/app/CharacterCreatePage";
import UniversesPage from "./pages/app/UniversesPage";
import UniverseDetailPage from "./pages/app/UniverseDetailPage";
import KnowledgeBasePage from "./pages/app/KnowledgeBasePage";
import BookBuilderPage from "./pages/app/BookBuilderPage";
import ProjectWorkspacePage from "./pages/app/ProjectWorkspacePage";
import BillingPage from "./pages/app/BillingPage";
import BillingSuccessPage from "./pages/app/BillingSuccessPage";
import BillingCancelPage from "./pages/app/BillingCancelPage";
import DemoViewerPage from "./pages/DemoViewerPage";
import AuthPage from "./pages/AuthPage";
import { AuthGuard } from "./components/auth/AuthGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/examples" element={<ExamplesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/product" element={<HomePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/faq" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Demo Routes (public) */}
          <Route path="/demo/:id" element={<DemoViewerPage />} />

          {/* App Routes (Protected) */}
          <Route
            path="/app/*"
            element={
              <AuthGuard>
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="universes" element={<UniversesPage />} />
                  <Route path="universes/:id" element={<UniverseDetailPage />} />
                  <Route path="characters" element={<CharactersPage />} />
                  <Route path="characters/new" element={<CharacterCreatePage />} />
                  <Route path="characters/:id" element={<CharacterDetailPage />} />
                  <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="books/new" element={<BookBuilderPage />} />
                  <Route path="projects" element={<DashboardPage />} />
                  <Route path="projects/:id" element={<ProjectWorkspacePage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="billing/success" element={<BillingSuccessPage />} />
                  <Route path="billing/cancel" element={<BillingCancelPage />} />
                  <Route path="settings" element={<DashboardPage />} />
                  <Route path="help" element={<DashboardPage />} />
                </Routes>
              </AuthGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
