import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReadAloudMenu } from "@/components/ui/read-aloud";
import { AppLayout } from "@/components/layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
import { AppSettingsProvider, useAppSettings } from "@/contexts/app-settings";
import { LimboEasterEgg } from "@/components/limbo-easter-egg";
import { SmartSearch } from "@/components/smart-search";
import 'katex/dist/katex.min.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const Home = lazy(() => import("@/pages/home"));
const Formulas = lazy(() => import("@/pages/formulas"));
const FormulaDetail = lazy(() => import("@/pages/formula-detail"));
const Constants = lazy(() => import("@/pages/constants"));
const Calculators = lazy(() => import("@/pages/calculators"));
const Converter = lazy(() => import("@/pages/converter"));
const AstronomyTools = lazy(() => import("@/pages/astronomy-tools"));
const Glossary = lazy(() => import("@/pages/glossary"));
const Favorites = lazy(() => import("@/pages/favorites"));
const Problems = lazy(() => import("@/pages/problems"));
const About = lazy(() => import("@/pages/about"));
const Donate = lazy(() => import("@/pages/donate"));
const Account = lazy(() => import("@/pages/account"));
const OwnerDashboard = lazy(() => import("@/pages/owner-dashboard"));
import NotFound from "@/pages/not-found";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/formulas": "Formulas",
  "/constants": "Constants",
  "/calculators": "Calculators",
  "/converter": "Unit Converter",
  "/astronomy-tools": "Astronomy Tools",
  "/glossary": "Glossary",
  "/favorites": "Favorites",
  "/problems": "Practice Problems",
  "/about": "About",
};

function getLabel(path: string): string {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  if (path.startsWith("/formulas/")) return "Formula Detail";
  return "Page";
}

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <Spinner className="w-8 h-8 text-primary" />
    </div>
  );
}

function RouteTracker() {
  const [location] = useLocation();
  const { setLastVisited, lastVisited } = useAppSettings();

  useEffect(() => {
    if (location === "/account") return;
    // Formula-detail sets its own label via name, so skip here
    if (location.startsWith("/formulas/") && location !== "/formulas") return;
    setLastVisited({ path: location, label: getLabel(location) });
  }, [location]);

  // Keep page title in sync (formula-detail sets its own, so skip those)
  useEffect(() => {
    if (location.startsWith("/formulas/") && location !== "/formulas") return;
    const title = lastVisited?.label ?? getLabel(location);
    document.title = title ? `${title} | Xquation` : "Xquation";
  }, [location, lastVisited]);

  return null;
}

function Router() {
  return (
    <AppLayout>
      <RouteTracker />
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/formulas/:id" component={FormulaDetail} />
          <Route path="/formulas" component={Formulas} />
          <Route path="/constants" component={Constants} />
          <Route path="/calculators" component={Calculators} />
          <Route path="/converter" component={Converter} />
          <Route path="/astronomy-tools" component={AstronomyTools} />
          <Route path="/glossary" component={Glossary} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/problems" component={Problems} />
          <Route path="/about" component={About} />
          <Route path="/donate" component={Donate} />
          <Route path="/account" component={Account} />
          <Route path="/owner-dashboard" component={OwnerDashboard} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
          <ReadAloudMenu />
          <LimboEasterEgg />
          <SmartSearch />
        </TooltipProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
