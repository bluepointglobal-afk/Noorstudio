import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExamplesPage from "./pages/ExamplesPage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/app/DashboardPage";
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
          <Route path="/templates" element={<HomePage />} />
          <Route path="/faq" element={<HomePage />} />
          
          {/* App Routes */}
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/characters" element={<DashboardPage />} />
          <Route path="/app/book-builder" element={<DashboardPage />} />
          <Route path="/app/knowledge-base" element={<DashboardPage />} />
          <Route path="/app/projects" element={<DashboardPage />} />
          <Route path="/app/chapters" element={<DashboardPage />} />
          <Route path="/app/illustrations" element={<DashboardPage />} />
          <Route path="/app/export" element={<DashboardPage />} />
          <Route path="/app/settings" element={<DashboardPage />} />
          <Route path="/app/help" element={<DashboardPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
