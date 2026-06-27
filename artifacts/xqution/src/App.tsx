import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReadAloudMenu } from "@/components/ui/read-aloud";
import { AppLayout } from "@/components/layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
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
const About = lazy(() => import("@/pages/about"));
import NotFound from "@/pages/not-found";

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <Spinner className="w-8 h-8 text-primary" />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
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
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
        <ReadAloudMenu />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
