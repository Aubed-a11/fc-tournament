import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Trophy, User as UserIcon, Shield, Menu, X, LogOut, ChevronDown, Bell } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, token, logout, quickLoginAdmin, quickLoginPlayer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      const fetchNotifs = async () => {
        try {
          const adminToken = sessionStorage.getItem('fc_admin_token') || localStorage.getItem('fc_admin_token');
          const res = await fetch('/api/admin/notifications', {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(adminToken ? { 'x-admin-token': adminToken } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadNotifs(data.unreadCount || 0);
          }
        } catch {
          // ignore
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const navLinks = [
    { id: 'home', label: 'Accueil' },
    { id: 'tournaments', label: 'Tournois' },
    { id: 'leaderboard', label: 'Classements' },
    { id: 'results', label: 'Résultats' },
    { id: 'rules', label: 'Règlement' },
    { id: 'about', label: 'À propos' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#07090e]/95 backdrop-blur-md border-b border-[#1a2130]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single clean element) */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left text-white group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00ff66] to-[#009933] flex items-center justify-center text-black font-black font-display text-xl shadow-[0_0_15px_rgba(0,255,102,0.4)]">
            FC
          </div>
          <span className="font-display text-2xl font-black tracking-wider text-white leading-none">
            FC <span className="text-[#00ff66]">TOURNAMENT</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links (single-line, quiet hover) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`whitespace-nowrap transition-colors py-1 cursor-pointer relative ${
                  isActive
                    ? 'text-[#00ff66] font-semibold'
                    : 'hover:text-white text-slate-300'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff66] rounded-full shadow-[0_0_8px_#00ff66]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Quick Demo Selector for evaluation convenience */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="text-xs px-2.5 py-1.5 rounded bg-[#131924] border border-[#222c40] text-slate-300 hover:text-white hover:border-[#00ff66]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tester avec un compte de démonstration"
            >
              <span>Accès Démo</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {demoDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-[#0e131d] border border-[#222c40] rounded-xl shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setDemoDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-slate-400 border-b border-[#1c2333]">
                  Connexion instantanée :
                </div>
                <button
                  onClick={async () => {
                    await quickLoginAdmin();
                    setDemoDropdownOpen(false);
                    onNavigate('admin');
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#182133] hover:text-[#00ff66] flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>Admin FC (Organisateur)</span>
                </button>
                <button
                  onClick={async () => {
                    await quickLoginPlayer();
                    setDemoDropdownOpen(false);
                    onNavigate('dashboard');
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-[#182133] hover:text-[#00ff66] flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>Amine_FC (Joueur démo)</span>
                </button>
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="p-2 rounded-xl bg-[#131924] border border-[#222c40] text-slate-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors relative cursor-pointer"
              title="Inscriptions et notifications administrateur"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#121722] border border-[#222d40] hover:border-[#00ff66]/50 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#1b2333] border border-[#00ff66]/40 overflow-hidden flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.gamertag} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-[#00ff66]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {user.gamertag}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {user.role === 'admin' ? 'Organisateur / Admin' : 'Joueur eSport'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#0e131d] border border-[#222c40] rounded-xl shadow-2xl py-2 z-50 text-sm"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#1c2333]">
                    <p className="text-xs text-slate-400">Connecté en tant que</p>
                    <p className="font-semibold text-white truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-[#182133] hover:text-[#00ff66] flex items-center gap-2.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-[#00ff66]" />
                    <span>Mon Espace Joueur</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-[#182133] hover:text-[#00ff66] flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Mon Profil</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-4 py-2.5 text-[#00ff66] bg-[#00ff66]/10 hover:bg-[#00ff66]/20 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Administration Tournois</span>
                    </button>
                  )}

                  <div className="border-t border-[#1c2333] my-1" />

                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await logout();
                      onNavigate('home');
                    }}
                    className="w-full text-left px-4 py-2 text-rose-400 hover:bg-[#1f1619] flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Connexion
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-4 py-2 text-xs font-bold text-black bg-[#00ff66] rounded-xl hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_15px_rgba(0,255,102,0.35)] hover:shadow-[0_0_20px_rgba(0,255,102,0.6)] cursor-pointer whitespace-nowrap"
              >
                Créer un compte
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#121722] text-slate-300 hover:text-white focus:outline-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0d14] border-b border-[#1c2333] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === link.id
                    ? 'bg-[#141b27] text-[#00ff66] font-bold'
                    : 'text-slate-300 hover:bg-[#121722] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1c2333] space-y-2">
            {user ? (
              <>
                <div className="px-3 py-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Connecté: <strong className="text-white">{user.gamertag}</strong></span>
                  <span className="text-[#00ff66] uppercase text-[10px]">{user.role}</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm bg-[#131a26] text-white flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-[#00ff66]" />
                  <span>Mon Espace Joueur</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm bg-[#00ff66]/15 text-[#00ff66] font-semibold flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Administration Tournois</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#121722]"
                >
                  Mon Profil
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    onNavigate('home');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-950/20"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#222c40] text-center text-sm font-medium text-white hover:bg-[#121722]"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00ff66] text-black text-center text-sm font-bold shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                >
                  Créer mon compte
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
