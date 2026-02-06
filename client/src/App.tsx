import React from 'react';
import { Router, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { DataProvider } from './contexts/DataContext';
import { ChatProvider } from './contexts/ChatContext';
import { MainLayout } from './components/layout/MainLayout';
import { GlobalChatPanel } from './components/chat/GlobalChatPanel';
import Dashboard from './pages/dashboard';
import VisualBuilder from './pages/visual-builder';
import DashboardComposer from './pages/dashboard-composer';
import ReportsPage from './pages/reports';
import './index.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ChatProvider>
          <Router>
            <MainLayout>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/visual-builder" component={VisualBuilder} />
              <Route path="/dashboard-composer" component={DashboardComposer} />
              <Route path="/reports" component={ReportsPage} />
            </MainLayout>
            <GlobalChatPanel />
          </Router>
        </ChatProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

export default App;
