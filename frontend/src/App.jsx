import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DonationsPage from './pages/DonationsPage';
import CreateDonationPage from './pages/CreateDonationPage';
import MatchesPage from './pages/MatchesPage';
import SheltersPage from './pages/SheltersPage';
import VolunteersPage from './pages/VolunteersPage';
import RescueMapPage from './pages/RescueMapPage';
import AgentsPage from './pages/AgentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import { ToastProvider } from './components/common/Toast';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes: Landing & Login */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Dashboard and Internal Operations Pages */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/donations/new" element={<CreateDonationPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/shelters" element={<SheltersPage />} />
            <Route path="/volunteers" element={<VolunteersPage />} />
            <Route path="/map" element={<RescueMapPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
