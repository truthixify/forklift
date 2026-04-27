import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletAuthProvider } from "@/components/auth/WalletAuth";
import { ScrollToTop } from "@/components/shell/ScrollToTop";
import { wagmiConfig } from "@/lib/wagmi";
import { forkliftTheme } from "@/lib/rainbow-theme";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BountyBoard from "./pages/BountyBoard";
import BountyDetail from "./pages/BountyDetail";
import AgentDirectory from "./pages/AgentDirectory";
import AgentProfile from "./pages/AgentProfile";
import PosterProfile from "./pages/PosterProfile";
import Templates from "./pages/Templates";
import Resources from "./pages/Resources";
import PostBounty from "./pages/PostBounty";
import PosterDashboard from "./pages/PosterDashboard";
import PosterBounties from "./pages/poster/PosterBounties";
import PosterHistory from "./pages/poster/PosterHistory";
import PosterPost from "./pages/poster/PosterPost";
import PosterSettings from "./pages/poster/PosterSettings";
import OperatorDashboard from "./pages/OperatorDashboard";
import OperatorAgents from "./pages/operator/OperatorAgents";
import OperatorAgentDetail from "./pages/operator/OperatorAgentDetail";
import OperatorEarnings from "./pages/operator/OperatorEarnings";
import OperatorDeploy from "./pages/operator/OperatorDeploy";
import OperatorSettings from "./pages/operator/OperatorSettings";
import LiveFeed from "./pages/LiveFeed";
import Docs from "./pages/Docs";
import ActivityPage from "./pages/dashboard/ActivityPage";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={forkliftTheme} modalSize="compact">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WalletAuthProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/bounties" element={<BountyBoard />} />
                <Route path="/bounties/:id" element={<BountyDetail />} />
                <Route path="/agents" element={<AgentDirectory />} />
                <Route path="/agents/:id" element={<AgentProfile />} />
                <Route path="/posters/:id" element={<PosterProfile />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/post" element={<PostBounty />} />

                {/* Poster dashboard */}
                <Route path="/dashboard/poster" element={<PosterDashboard />} />
                <Route path="/dashboard/poster/bounties" element={<PosterBounties />} />
                <Route path="/dashboard/poster/history" element={<PosterHistory />} />
                <Route path="/dashboard/poster/post" element={<PosterPost />} />
                <Route path="/dashboard/poster/settings" element={<PosterSettings />} />
                <Route path="/dashboard/poster/activity" element={<ActivityPage role="poster" />} />
                <Route path="/dashboard/poster/notifications" element={<Navigate to="/dashboard/poster/activity" replace />} />

                {/* Operator dashboard */}
                <Route path="/dashboard/operator" element={<OperatorDashboard />} />
                <Route path="/dashboard/operator/agents" element={<OperatorAgents />} />
                <Route path="/dashboard/operator/agents/:id" element={<OperatorAgentDetail />} />
                <Route path="/dashboard/operator/earnings" element={<OperatorEarnings />} />
                <Route path="/dashboard/operator/deploy" element={<OperatorDeploy />} />
                <Route path="/dashboard/operator/settings" element={<OperatorSettings />} />
                <Route path="/dashboard/operator/activity" element={<ActivityPage role="operator" />} />
                <Route path="/dashboard/operator/notifications" element={<Navigate to="/dashboard/operator/activity" replace />} />

                <Route path="/feed" element={<LiveFeed />} />
                <Route path="/notifications" element={<Navigate to="/dashboard/poster" replace />} />
                <Route path="/settings" element={<Navigate to="/dashboard/poster/settings" replace />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WalletAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
