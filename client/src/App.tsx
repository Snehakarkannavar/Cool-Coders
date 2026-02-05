import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import VisualBuilder from "@/pages/visual-builder";
import DashboardComposer from "@/pages/dashboard-composer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/visual-builder" component={VisualBuilder} />
      <Route path="/dashboard-composer" component={DashboardComposer} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}
