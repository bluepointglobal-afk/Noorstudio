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
import KnowledgeBasePage from "./pages/app/KnowledgeBasePage";
import BookBuilderPage from "./pages/app/BookBuilderPage";
import ProjectWorkspacePage from "./pages/app/ProjectWorkspacePage";
import BillingPage from "./pages/app/BillingPage";
import DemoViewerPage from "./pages/DemoViewerPage";
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

          {/* Demo Routes (public) */}
          <Route path="/demo/:id" element={<DemoViewerPage />} />

          {/* App Routes */}
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/universes" element={<UniversesPage />} />
          <Route path="/app/characters" element={<CharactersPage />} />
          <Route path="/app/characters/new" element={<CharacterCreatePage />} />
          <Route path="/app/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/app/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/app/books/new" element={<BookBuilderPage />} />
          <Route path="/app/projects" element={<DashboardPage />} />
          <Route path="/app/projects/:id" element={<ProjectWorkspacePage />} />
          <Route path="/app/billing" element={<BillingPage />} />
          <Route path="/app/settings" element={<DashboardPage />} />
          <Route path="/app/help" element={<DashboardPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
