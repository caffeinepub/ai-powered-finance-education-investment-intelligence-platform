import React from 'react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
  Navigate,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import TopNav from './components/TopNav';
import ProfileSetupModal from './components/ProfileSetupModal';
import HomePage from './pages/HomePage';
import LearningModulePage from './pages/LearningModulePage';
import TopicLessonPage from './pages/TopicLessonPage';
import TopicQuizPage from './pages/TopicQuizPage';
import StockPlaygroundPage from './pages/StockPlaygroundPage';
import NewsModulePage from './pages/NewsModulePage';
import PortfolioAnalyzerPage from './pages/PortfolioAnalyzerPage';
import AdvisorChatPage from './pages/AdvisorChatPage';
import CommunityForumPage from './pages/CommunityForumPage';
import ProfilePage from './pages/ProfilePage';
import ApiReferencePage from './pages/ApiReferencePage';

// ─── Layout ───────────────────────────────────────────────────────────────────

function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && profile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading FinIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <ProfileSetupModal open={showProfileSetup} />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-border/30 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/assets/generated/finiq-logo.dim_256x256.png" alt="FinIQ" className="h-5 w-5 object-contain" />
            <span className="font-display font-semibold text-foreground">FinIQ</span>
            <span>— AI-Powered Finance Intelligence</span>
          </div>
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Built with</span>
            <span className="text-red-400">♥</span>
            <span>using</span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'finiq-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Protected Route Wrapper ──────────────────────────────────────────────────

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Login Required</h2>
          <p className="text-muted-foreground max-w-sm">
            Please log in to access this feature and track your progress.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn',
  component: () => <ProtectedPage><LearningModulePage /></ProtectedPage>,
});

const topicLessonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn/$topicId',
  component: () => <ProtectedPage><TopicLessonPage /></ProtectedPage>,
});

const topicQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn/$topicId/quiz',
  component: () => <ProtectedPage><TopicQuizPage /></ProtectedPage>,
});

const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playground',
  component: () => <ProtectedPage><StockPlaygroundPage /></ProtectedPage>,
});

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news',
  component: NewsModulePage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: () => <ProtectedPage><PortfolioAnalyzerPage /></ProtectedPage>,
});

const advisorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/advisor',
  component: () => <ProtectedPage><AdvisorChatPage /></ProtectedPage>,
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community',
  component: CommunityForumPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <ProtectedPage><ProfilePage /></ProtectedPage>,
});

const apiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api',
  component: ApiReferencePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  learnRoute,
  topicLessonRoute,
  topicQuizRoute,
  playgroundRoute,
  newsRoute,
  portfolioRoute,
  advisorRoute,
  communityRoute,
  profileRoute,
  apiRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
