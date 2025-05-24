import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Documents from "./pages/Documents";
import Learning from "./pages/Learning";
import Insights from "./pages/Insights";
import ConceptGraph from "./pages/ConceptGraph";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import { Suspense } from "react";
import Statistics from "./pages/Statistics";
import { ConceptLearningHub } from "./pages/ConceptLearningHub";

import type { RouteComponentProps } from 'wouter';

// Type for route params
type Params = { conceptId?: string };

// Function to convert Wouter route params to component props
const withRouteParams = (Component: React.ComponentType<any>, initialProps: any = {}) => 
  (props: RouteComponentProps<any>) => <Component {...initialProps} {...props.params} />;

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/documents" component={Documents} />
        <Route path="/learning" component={Learning} />
        <Route path="/insights" component={Insights} />
        <Route path="/knowledge" component={ConceptGraph} />
        <Route path="/graph" component={KnowledgeGraph} />
        <Route path="/graph/:conceptId" component={withRouteParams(KnowledgeGraph)} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={ProfileSettings} />
        <Route path="/statistics">
          {() => (
            <Suspense fallback={<div className="container mx-auto py-12 text-center">Loading statistics...</div>}>
              <Statistics />
            </Suspense>
          )}
        </Route>
        <Route path="/quiz/:conceptId">
          {({ conceptId }) => {
            const conceptIdParam = conceptId ? parseInt(conceptId) : undefined;
            return <Learning conceptId={conceptIdParam} initialTab="quiz" />;
          }}
        </Route>
        <Route path="/concept/:conceptId/learn" component={withRouteParams(ConceptLearningHub)} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
