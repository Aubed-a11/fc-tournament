/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { Home } from './pages/Home.tsx';
import { Tournaments } from './pages/Tournaments.tsx';
import { TournamentDetail } from './pages/TournamentDetail.tsx';
import { Leaderboard } from './pages/Leaderboard.tsx';
import { Results } from './pages/Results.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Profile } from './pages/Profile.tsx';
import { Admin } from './pages/Admin.tsx';
import { About } from './pages/About.tsx';
import { Contact } from './pages/Contact.tsx';
import { TermsPrivacy } from './pages/TermsPrivacy.tsx';
import { Rules } from './pages/Rules.tsx';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string | undefined>(undefined);

  // Sync with browser URL / hash
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const [page, param] = hash.split('/');
        setCurrentPage(page || 'home');
        setPageParam(param);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page);
    setPageParam(param);
    const newHash = param ? `#${page}/${param}` : `#${page}`;
    window.history.pushState(null, '', newHash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'tournaments':
        return <Tournaments onNavigate={handleNavigate} />;
      case 'tournament-detail':
        return <TournamentDetail tournamentId={pageParam || 'tourn_spring_2026'} onNavigate={handleNavigate} />;
      case 'leaderboard':
        return <Leaderboard onNavigate={handleNavigate} />;
      case 'results':
        return <Results onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      case 'admin':
        return <Admin onNavigate={handleNavigate} />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsPrivacy onNavigate={handleNavigate} />;
      case 'rules':
        return <Rules onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col font-sans selection:bg-[#00ff66] selection:text-black">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
