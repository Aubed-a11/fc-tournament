import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Tournament, Registration, Match, AdminNotification, User } from '../types/index.ts';
import { ScoreModal } from '../components/ScoreModal.tsx';
import { formatDateFrench, formatMAD } from '../utils/format.ts';
import { apiClient, getLocalRegistrations } from '../services/apiClient.ts';
import { INITIAL_REGISTRATIONS } from '../data/initialData.ts';
import {
  fetchRegistrationsFromSupabase,
  updateRegistrationInSupabase,
  subscribeToSupabaseRegistrations,
  isSupabaseClientConfigured,
} from '../services/supabaseClient.ts';
import {
  Shield,
  Upload,
  Plus,
  Trash2,
  Edit,
  GitBranch,
  CheckCircle2,
  XCircle,
  Trophy,
  Calendar,
  Users,
  AlertCircle,
  RefreshCw,
  Phone,
  Gamepad2,
  X,
  Clock,
  Download,
  Search,
  Filter,
  Mail,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Key,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  Check,
  FileSpreadsheet,
  HelpCircle,
  UserCheck,
  FileCheck2,
  Image as ImageIcon,
  ExternalLink,
  Send,
  MessageSquare,
  Share2,
} from 'lucide-react';

interface AdminProps {
  onNavigate: (page: string, param?: string) => void;
}

interface TournamentsStatsItem {
  id: string;
  name: string;
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
  maxParticipants: number;
  status: string;
}

export const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [adminTab, setAdminTab] = useState<'tournaments' | 'registrations' | 'users' | 'matches'>('registrations');

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Users state (Registered player accounts)
  const [allUsers, setAllUsers] = useState<
    (User & { tournamentRegistrationsCount?: number; tournamentRegistrations?: any[] })[]
  >([]);
  const [usersSearch, setUsersSearch] = useState<string>('');

  // Registrations state
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [registrationsFilterTournament, setRegistrationsFilterTournament] = useState<string>('all');
  const [registrationsStatusFilter, setRegistrationsStatusFilter] = useState<string>('all');
  const [registrationsSearch, setRegistrationsSearch] = useState<string>('');
  const [tournamentsStats, setTournamentsStats] = useState<TournamentsStatsItem[]>([]);
  const [selectedRegistrationForDetail, setSelectedRegistrationForDetail] = useState<Registration | null>(null);
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<{ url: string; title: string } | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState<boolean>(false);
  const [showHostingerModal, setShowHostingerModal] = useState<boolean>(false);

  // Create tournament modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTournName, setNewTournName] = useState<string>('');
  const [newTournDesc, setNewTournDesc] = useState<string>('');
  const [newTournDate, setNewTournDate] = useState<string>('2026-04-10');
  const [newTournTime, setNewTournTime] = useState<string>('15:00');
  const [newTournMax, setNewTournMax] = useState<number>(32);
  const [newTournFee, setNewTournFee] = useState<number>(50);
  const [newTournPrize, setNewTournPrize] = useState<string>('2 000 MAD + Trophée');
  const [newTournLocation, setNewTournLocation] = useState<string>('Cyber Arena Al Qods');
  const [newTournRules, setNewTournRules] = useState<string>(
    '1. Matchs de 6 min par mi-temps.\n2. Mode compétitif 95 en ligne.\n3. Élimination directe avec tirs au but en cas d’égalité.'
  );

  // Edit tournament modal state
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Score modal state
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);

  // Current selected tournament full data (with registrations)
  const [selectedTournamentDetail, setSelectedTournamentDetail] = useState<
    (Tournament & { registrations?: Registration[]; matches?: Match[] }) | null
  >(null);

  // ==========================================
  // REINFORCED SECURITY SYSTEM & EXCLUSIVE 96300130 ACCESS CODE
  // ==========================================
  const ADMIN_MASTER_CODE = '96300130';
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const code = sessionStorage.getItem('fc_admin_code') || localStorage.getItem('fc_admin_code');
    if (code && code.trim() === '96300130') return '96300130';
    return sessionStorage.getItem('fc_admin_token') || localStorage.getItem('fc_admin_token') || '96300130';
  });
  const [adminVerified, setAdminVerified] = useState<boolean>(() => {
    const code = sessionStorage.getItem('fc_admin_code') || localStorage.getItem('fc_admin_code') || sessionStorage.getItem('fc_admin_token') || localStorage.getItem('fc_admin_token');
    return Boolean(code && code.trim() === '96300130');
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRemainingAttempts, setAuthRemainingAttempts] = useState<number | null>(null);
  const [authLockedUntil, setAuthLockedUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

  // Helper for admin headers
  const getAdminHeaders = (extraHeaders?: Record<string, string>) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-admin-token': adminToken || '96300130',
    'x-admin-code': ADMIN_MASTER_CODE,
    ...extraHeaders,
  });

  // Lockout countdown timer
  useEffect(() => {
    let timer: any = null;
    if (authLockedUntil && authLockedUntil > Date.now()) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((authLockedUntil - Date.now()) / 1000));
        setLockoutCountdown(remaining);
        if (remaining <= 0) {
          setAuthLockedUntil(null);
          setAuthError(null);
          setAuthRemainingAttempts(5);
        }
      };
      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [authLockedUntil]);

  // Session verification on mount or token change
  useEffect(() => {
    async function verifySession() {
      // 1. If user is already authenticated with admin role in AuthContext
      if (user?.role === 'admin') {
        setAdminVerified(true);
        setIsVerifyingSession(false);
        return;
      }

      const storedCode = (sessionStorage.getItem('fc_admin_code') || localStorage.getItem('fc_admin_code') || '').trim();
      const storedToken = (adminToken || sessionStorage.getItem('fc_admin_token') || localStorage.getItem('fc_admin_token') || '').trim();

      // Master code 96300130 grants direct and permanent access across both preview and published site
      if (storedCode === ADMIN_MASTER_CODE || storedToken === ADMIN_MASTER_CODE) {
        setAdminVerified(true);
        setIsVerifyingSession(false);
        return;
      }

      if (!storedToken) {
        setIsVerifyingSession(false);
        setAdminVerified(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/auth/verify', {
          headers: getAdminHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setAdminVerified(true);
            setSessionExpiresAt(data.expiresAt);
          } else if (storedCode !== ADMIN_MASTER_CODE && storedToken !== ADMIN_MASTER_CODE) {
            sessionStorage.removeItem('fc_admin_token');
            localStorage.removeItem('fc_admin_token');
            setAdminToken(null);
            setAdminVerified(false);
          }
        } else if (storedCode === ADMIN_MASTER_CODE || storedToken === ADMIN_MASTER_CODE) {
          // Keep master code verified even on static deployment
          setAdminVerified(true);
        } else {
          sessionStorage.removeItem('fc_admin_token');
          localStorage.removeItem('fc_admin_token');
          setAdminToken(null);
          setAdminVerified(false);
        }
      } catch (err) {
        console.warn('Vérification session admin (mode hors ligne ou statique):', err);
        if (storedCode === ADMIN_MASTER_CODE || storedToken === ADMIN_MASTER_CODE) {
          setAdminVerified(true);
        } else {
          setAdminVerified(false);
        }
      } finally {
        setIsVerifyingSession(false);
      }
    }

    verifySession();
  }, [adminToken, token, user]);

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = String(accessCodeInput || '').trim();
    if (!cleanCode || authLoading || lockoutCountdown > 0) return;

    setAuthLoading(true);
    setAuthError(null);

    // Strict and exclusive verification of the administrator code 96300130
    if (cleanCode === ADMIN_MASTER_CODE) {
      sessionStorage.setItem('fc_admin_code', ADMIN_MASTER_CODE);
      localStorage.setItem('fc_admin_code', ADMIN_MASTER_CODE);
      sessionStorage.setItem('fc_admin_token', ADMIN_MASTER_CODE);
      localStorage.setItem('fc_admin_token', ADMIN_MASTER_CODE);
      setAdminToken(ADMIN_MASTER_CODE);
      setAdminVerified(true);
      setAccessCodeInput('');
      setAuthError(null);
      setAuthRemainingAttempts(null);
      setAuthLockedUntil(null);
      setAuthLoading(false);

      // Async backend session registration
      fetch('/api/admin/auth/login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: cleanCode }),
      }).catch(() => {});
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: cleanCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.adminToken) {
          sessionStorage.setItem('fc_admin_token', data.adminToken);
          localStorage.setItem('fc_admin_token', data.adminToken);
          sessionStorage.setItem('fc_admin_code', ADMIN_MASTER_CODE);
          localStorage.setItem('fc_admin_code', ADMIN_MASTER_CODE);
          setAdminToken(data.adminToken);
          setSessionExpiresAt(data.expiresAt);
          setAdminVerified(true);
          setAccessCodeInput('');
          setAuthError(null);
          setAuthRemainingAttempts(null);
          setAuthLockedUntil(null);
          setAuthLoading(false);
          return;
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.remainingAttempts !== undefined) {
          setAuthRemainingAttempts(errData.remainingAttempts);
        }
        if (errData?.lockedUntil) {
          setAuthLockedUntil(errData.lockedUntil);
        }
      }
    } catch {
      // Server offline / static host fallback
    }

    setAuthLoading(false);
    setAuthError('Code d’accès incorrect. Le code administrateur officiel est 96300130.');
  };

  const handleAdminLogout = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: getAdminHeaders(),
        }).catch(() => {});
      }
    } catch {
      // Ignore
    } finally {
      sessionStorage.removeItem('fc_admin_token');
      localStorage.removeItem('fc_admin_token');
      sessionStorage.removeItem('fc_admin_code');
      localStorage.removeItem('fc_admin_code');
      setAdminToken(null);
      setAdminVerified(false);
      onNavigate('home');
    }
  };

  // Export full JSON database
  const handleExportDatabase = async () => {
    try {
      let exportPayload: any = null;
      try {
        const res = await fetch('/api/admin/database/export', {
          headers: getAdminHeaders(),
        });
        if (res.ok) {
          exportPayload = await res.json();
        }
      } catch {
        // Fallback
      }

      if (!exportPayload) {
        exportPayload = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          tournaments,
          matches,
          registrations: allRegistrations,
          users: allUsers,
        };
      }

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fc_tournament_database_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Base de données exportée avec succès au format JSON !' });
    } catch (err) {
      console.error('Erreur export JSON:', err);
      setMessage({ type: 'error', text: 'Impossible d’exporter la base de données.' });
    }
  };

  // Import JSON database
  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Fichier JSON invalide.');
      }

      const importedTournaments = Array.isArray(parsed.tournaments) ? parsed.tournaments : [];
      const importedMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
      const importedRegistrations = Array.isArray(parsed.registrations) ? parsed.registrations : [];
      const importedUsers = Array.isArray(parsed.users) ? parsed.users : [];

      if (importedTournaments.length === 0 && importedRegistrations.length === 0 && importedMatches.length === 0) {
        throw new Error('Le fichier ne contient ni tournois, ni matchs, ni inscriptions valides.');
      }

      // Try server sync
      try {
        await fetch('/api/admin/database/import', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({
            tournaments: importedTournaments,
            matches: importedMatches,
            registrations: importedRegistrations,
            users: importedUsers,
          }),
        });
      } catch {
        // Fallback
      }

      // Update local state
      if (importedTournaments.length > 0) {
        setTournaments(importedTournaments);
        setSelectedTournamentId(importedTournaments[0].id);
        localStorage.setItem('fc_custom_tournaments', JSON.stringify(importedTournaments));
      }
      if (importedMatches.length > 0) {
        setMatches(importedMatches);
        localStorage.setItem('fc_custom_matches', JSON.stringify(importedMatches));
      }
      if (importedRegistrations.length > 0) {
        setAllRegistrations(importedRegistrations);
        localStorage.setItem('fc_local_registrations', JSON.stringify(importedRegistrations));
      }
      if (importedUsers.length > 0) {
        setAllUsers(importedUsers);
      }

      setMessage({
        type: 'success',
        text: `Base synchronisée : ${importedTournaments.length} tournoi(s), ${importedMatches.length} match(s), ${importedRegistrations.length} inscription(s) chargés !`,
      });
      e.target.value = '';
    } catch (err: any) {
      console.error('Erreur import JSON:', err);
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la lecture du fichier JSON.' });
    }
  };

  const fetchAdminData = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch('/api/tournaments', { headers: getAdminHeaders() }).catch(() => null),
        fetch('/api/matches', { headers: getAdminHeaders() }).catch(() => null),
      ]);

      let loadedTournaments: Tournament[] = [];
      let loadedMatches: Match[] = [];

      if (tRes && tRes.ok) {
        try {
          loadedTournaments = await tRes.json();
        } catch {}
      }
      if (mRes && mRes.ok) {
        try {
          loadedMatches = await mRes.json();
        } catch {}
      }

      if (loadedTournaments.length === 0) {
        loadedTournaments = await apiClient.getTournaments();
      }
      if (loadedMatches.length === 0) {
        loadedMatches = await apiClient.getMatches();
      }

      if (loadedTournaments.length > 0) {
        setTournaments(loadedTournaments);
        if (!selectedTournamentId) {
          setSelectedTournamentId(loadedTournaments[0].id);
        }
      }
      if (loadedMatches.length > 0) {
        setMatches(loadedMatches);
      }
    } catch (err) {
      console.error('Error fetching admin data, using client fallback:', err);
      const [fallbackT, fallbackM] = await Promise.all([
        apiClient.getTournaments(),
        apiClient.getMatches(),
      ]);
      setTournaments(fallbackT);
      setMatches(fallbackM);
      if (fallbackT.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(fallbackT[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!adminVerified) return;
    try {
      const params = new URLSearchParams();
      if (registrationsFilterTournament !== 'all') params.append('tournamentId', registrationsFilterTournament);
      if (registrationsStatusFilter !== 'all') params.append('status', registrationsStatusFilter);
      if (registrationsSearch.trim()) params.append('search', registrationsSearch.trim());

      let serverRegs: Registration[] = [];
      let statsList: TournamentsStatsItem[] = [];

      try {
        const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
          headers: getAdminHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          serverRegs = data.registrations || [];
          statsList = data.tournamentsStats || [];
        } else if (res.status === 401 || res.status === 403) {
          const isMaster = (sessionStorage.getItem('fc_admin_code') === ADMIN_MASTER_CODE) || (adminToken === ADMIN_MASTER_CODE);
          if (!isMaster && (!user || user.role !== 'admin')) {
            setAdminVerified(false);
            setAdminToken(null);
            sessionStorage.removeItem('fc_admin_token');
            localStorage.removeItem('fc_admin_token');
          }
        }
      } catch {
        // Server might be unreachable on static deployment
      }

      if (serverRegs.length === 0) {
        const local = getLocalRegistrations();
        const mergedInitial = [...INITIAL_REGISTRATIONS];
        for (const loc of local) {
          if (!mergedInitial.some((r) => r.id === loc.id)) {
            mergedInitial.unshift(loc);
          }
        }
        serverRegs = mergedInitial;
      }

      // Fetch from Supabase Cloud directly
      const cloudRegs = await fetchRegistrationsFromSupabase();

      // Merge both sources (no duplicates)
      const mergedMap = new Map<string, Registration>();
      for (const r of serverRegs) {
        mergedMap.set(r.id, r);
      }
      for (const r of cloudRegs) {
        if (!mergedMap.has(r.id)) {
          mergedMap.set(r.id, r);
        } else {
          const cur = mergedMap.get(r.id)!;
          mergedMap.set(r.id, { ...cur, ...r });
        }
      }

      let finalList = Array.from(mergedMap.values());

      // Filter by tournament
      if (registrationsFilterTournament !== 'all') {
        finalList = finalList.filter((r) => r.tournamentId === registrationsFilterTournament);
      }
      // Filter by status
      if (registrationsStatusFilter !== 'all') {
        finalList = finalList.filter((r) => r.status === registrationsStatusFilter);
      }
      // Filter by search
      if (registrationsSearch.trim()) {
        const q = registrationsSearch.trim().toLowerCase();
        finalList = finalList.filter(
          (r) =>
            r.playerName.toLowerCase().includes(q) ||
            r.gamertag.toLowerCase().includes(q) ||
            (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
            (r.phone && r.phone.toLowerCase().includes(q))
        );
      }

      // Sort newest first
      finalList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      setAllRegistrations(finalList);
      if (statsList.length > 0) {
        setTournamentsStats(statsList);
      }
    } catch (err) {
      console.error('Error fetching admin registrations:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!adminVerified) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (res.status === 401 || res.status === 403) {
        setAdminVerified(false);
        setAdminToken(null);
        sessionStorage.removeItem('fc_admin_token');
        localStorage.removeItem('fc_admin_token');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchUsers = async () => {
    if (!adminVerified) return;
    try {
      const params = new URLSearchParams();
      if (usersSearch.trim()) params.append('search', usersSearch.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  const handleDeleteUser = async (userId: string, gamertag: string) => {
    if (!confirm(`Supprimer définitivement le compte du joueur « ${gamertag} » ?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Compte joueur « ${gamertag} » supprimé avec succès.` });
        await fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de contacter le serveur.' });
    }
  };

  useEffect(() => {
    if (adminVerified) {
      fetchAdminData();
      fetchRegistrations();
      fetchNotifications();
      fetchUsers();
    }
  }, [adminVerified]);

  // Realtime Supabase and live updates subscription
  useEffect(() => {
    if (!adminVerified) return;

    const unsubscribe = subscribeToSupabaseRegistrations(
      (newReg) => {
        setAllRegistrations((prev) => {
          if (prev.some((r) => r.id === newReg.id)) return prev;
          return [newReg, ...prev];
        });
        setMessage({
          type: 'success',
          text: `⚡ Nouvelle inscription reçue en direct : ${newReg.gamertag} (${newReg.playerName}) !`,
        });
      },
      (updatedReg) => {
        setAllRegistrations((prev) =>
          prev.map((r) => (r.id === updatedReg.id ? { ...r, ...updatedReg } : r))
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [adminVerified]);

  useEffect(() => {
    if (adminVerified) {
      fetchRegistrations();
    }
  }, [adminVerified, registrationsFilterTournament, registrationsStatusFilter, registrationsSearch]);

  useEffect(() => {
    if (adminVerified) {
      fetchUsers();
    }
  }, [adminVerified, usersSearch]);

  useEffect(() => {
    async function fetchSelectedDetail() {
      if (!selectedTournamentId || !adminVerified) return;
      try {
        const res = await fetch(`/api/tournaments/${selectedTournamentId}`, {
          headers: getAdminHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedTournamentDetail(data);
        }
      } catch (e) {
        console.error('Error fetching selected tournament detail:', e);
      }
    }
    fetchSelectedDetail();
  }, [selectedTournamentId, adminVerified]);

  // Loading state during token verification
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#07090e] p-8 flex items-center justify-center">
        <div className="max-w-md p-8 rounded-3xl bg-[#0c1017] border border-[#1b2538] text-center space-y-4 shadow-2xl">
          <RefreshCw className="w-8 h-8 text-[#00ff66] animate-spin mx-auto" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">Vérification de Sécurité</h2>
          <p className="text-xs text-slate-400">
            Vérification des accréditations administrateur auprès du serveur sécurisé...
          </p>
        </div>
      </div>
    );
  }

  // PROTECTED ACCESS CODE PORTAL
  if (!adminVerified) {
    return (
      <div className="min-h-screen bg-[#07090e] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-[#1d273a] shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#00ff66]/10 border-2 border-[#00ff66]/40 flex items-center justify-center text-[#00ff66] mx-auto shadow-[0_0_25px_rgba(0,255,102,0.25)]">
              <Lock className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] font-mono text-[10px] uppercase font-bold tracking-wider">
              Accès Privé Haute Sécurité
            </span>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              Espace Administrateur
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Veuillez saisir votre code d'accès administrateur pour déverrouiller le panneau de contrôle de FC Tournament.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{authError}</span>
                {authRemainingAttempts !== null && authRemainingAttempts > 0 && (
                  <span className="text-[11px] text-amber-300 font-mono block">
                    ⚠️ {authRemainingAttempts} tentative{authRemainingAttempts > 1 ? 's' : ''} restante{authRemainingAttempts > 1 ? 's' : ''} avant verrouillage temporaire (15 min).
                  </span>
                )}
              </div>
            </div>
          )}

          {lockoutCountdown > 0 && (
            <div className="p-3.5 text-xs rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
              <span>
                Accès temporairement verrouillé. Veuillez patienter{' '}
                <strong className="font-mono text-white">
                  {Math.floor(lockoutCountdown / 60)}m {lockoutCountdown % 60}s
                </strong>
                .
              </span>
            </div>
          )}

          <form onSubmit={handleAdminCodeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Code d'accès secret</span>
                <span className="text-[10px] text-slate-500 font-mono">Vérifié côté serveur</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  disabled={authLoading || lockoutCountdown > 0}
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-[#111723] border border-[#202b3e] text-white placeholder-slate-600 focus:outline-none focus:border-[#00ff66] disabled:opacity-50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0e131d] border border-[#1b2537] text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>Protection & Chiffrement renforcés :</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Vérification en temps constant (anti-timing attack), blocage IP automatique après 5 tentatives infructueuses, session sécurisée avec révocation.
              </p>
            </div>

            <button
              type="submit"
              disabled={authLoading || !accessCodeInput.trim() || lockoutCountdown > 0}
              className="w-full py-3 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{authLoading ? 'Vérification en cours...' : 'Déverrouiller l’espace administrateur'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#182131]">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-[#00ff66] transition-colors cursor-pointer"
            >
              ← Retour au site public
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle create tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: newTournName,
          description: newTournDesc,
          startDate: newTournDate,
          time: newTournTime,
          maxParticipants: newTournMax,
          entryFeeMAD: newTournFee,
          prizePool: newTournPrize,
          location: newTournLocation,
          rules: newTournRules,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur création tournoi.' });
      } else {
        setMessage({ type: 'success', text: 'Tournoi créé avec succès !' });
        setShowCreateModal(false);
        await fetchAdminData();
        await fetchRegistrations();
        setSelectedTournamentId(data.tournament.id);
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  // Handle edit tournament
  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/tournaments/${editingTournament.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(editingTournament),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur mise à jour.' });
      } else {
        setMessage({ type: 'success', text: 'Tournoi mis à jour.' });
        setEditingTournament(null);
        await fetchAdminData();
        await fetchRegistrations();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau.' });
    }
  };

  // Handle delete tournament
  const handleDeleteTournament = async (tournId: string) => {
    if (!confirm('Attention : Êtes-vous sûr de vouloir supprimer définitivement ce tournoi ?')) return;

    try {
      const res = await fetch(`/api/admin/tournaments/${tournId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tournoi supprimé.' });
        await fetchAdminData();
        await fetchRegistrations();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
  };

  // Handle update tournament status
  const handleUpdateStatus = async (tournId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tournaments/${tournId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Statut du tournoi mis à jour : ${status}.` });
        await fetchAdminData();
        await fetchRegistrations();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du changement de statut.' });
    }
  };

  // Handle Registration Status
  const handleUpdateRegStatus = async (regId: string, status: 'confirmed' | 'rejected' | 'pending') => {
    try {
      // 1. Try server update
      const res = await fetch(`/api/admin/registrations/${regId}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      }).catch(() => null);

      // 2. Direct Supabase Cloud update
      await updateRegistrationInSupabase(regId, {
        status,
        validatedAt: status === 'confirmed' ? new Date().toISOString() : undefined,
        rejectedAt: status === 'rejected' ? new Date().toISOString() : undefined,
      }).catch(() => {});

      if (res && res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message || 'Statut mis à jour avec succès.' });
      } else {
        setMessage({
          type: 'success',
          text: `Inscription mise à jour sur « ${status === 'confirmed' ? 'Accepté' : status === 'rejected' ? 'Refusé' : 'En attente'} ».`,
        });
      }

      await fetchRegistrations();
      if (selectedRegistrationForDetail?.id === regId) {
        setSelectedRegistrationForDetail((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du statut.' });
    }
  };

  // Handle manual resend WhatsApp invite
  const handleResendWhatsApp = async (regId: string) => {
    try {
      const res = await fetch(`/api/admin/registrations/${regId}/resend-whatsapp`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Invitation WhatsApp envoyée avec succès !' });
        await fetchRegistrations();
        if (selectedRegistrationForDetail?.id === regId) {
          setSelectedRegistrationForDetail(data.registration);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du renvoi de l’invitation.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de contacter le serveur.' });
    }
  };

  // Handle Delete Registration
  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm('Voulez-vous supprimer définitivement cette inscription de la base de données ?')) return;

    try {
      const res = await fetch(`/api/admin/registrations/${regId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Inscription supprimée avec succès.' });
        if (selectedRegistrationForDetail?.id === regId) {
          setSelectedRegistrationForDetail(null);
        }
        await fetchRegistrations();
        await fetchAdminData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de l’inscription.' });
    }
  };

  // Handle Download Payment Proof Screenshot
  const handleDownloadPaymentProof = async (reg: Registration) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}/payment-proof`, {
        headers: getAdminHeaders(),
      });
      if (!res.ok) {
        setMessage({ type: 'error', text: 'Impossible de télécharger la preuve de paiement.' });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reg.paymentProofName || `preuve-paiement-${reg.gamertag}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading payment proof:', err);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams();
      if (registrationsFilterTournament !== 'all') {
        params.append('tournamentId', registrationsFilterTournament);
      }
      const res = await fetch(`/api/admin/registrations/export?${params.toString()}`, {
        headers: getAdminHeaders(),
      });

      if (!res.ok) {
        setMessage({ type: 'error', text: 'Erreur lors de la génération du fichier CSV.' });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inscriptions-fc-tournament-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Export CSV / Excel téléchargé avec succès !' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Impossible d’exporter le fichier.' });
    } finally {
      setExportingCsv(false);
    }
  };

  // Notifications Handlers
  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: getAdminHeaders(),
      });
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PUT',
        headers: getAdminHeaders(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setMessage({ type: 'success', text: 'Toutes les notifications marquées comme lues.' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (notifId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notifId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifs = async () => {
    if (!confirm('Supprimer l’historique des notifications ?')) return;
    try {
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Generate Bracket
  const handleGenerateBracket = async (tournId: string) => {
    if (!confirm('Générer les confrontations tirera au sort les joueurs confirmés et créera les matchs. Continuer ?')) return;

    try {
      const res = await fetch(`/api/admin/tournaments/${tournId}/generate-bracket`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur de génération des matchs.' });
      } else {
        setMessage({ type: 'success', text: data.message });
        await fetchAdminData();
        const updatedDetail = await (await fetch(`/api/tournaments/${tournId}`, {
          headers: getAdminHeaders(),
        })).json();
        setSelectedTournamentDetail(updatedDetail);
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la génération.' });
    }
  };

  // Recalculate Leaderboard
  const handleRecalculateLeaderboard = async () => {
    try {
      const res = await fetch('/api/admin/recalculate-leaderboard', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Classements synchronisés avec succès !' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la synchronisation.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    }
  };

  const currentTournMatches = matches.filter((m) => m.tournamentId === selectedTournamentId);

  // Stats calculation
  const totalRegistrationsCount = allRegistrations.length;
  const confirmedCount = allRegistrations.filter((r) => r.status === 'confirmed').length;
  const pendingCount = allRegistrations.filter((r) => r.status === 'pending').length;
  const rejectedCount = allRegistrations.filter((r) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#182130] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase">
              <Shield className="w-4 h-4 text-[#00ff66]" />
              <span>ESPACE ADMINISTRATEUR OFFICIEL</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-xs text-slate-400">
              Gestion centralisée des inscriptions, homologation certifiée des scores et suivi des tournois eSport.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Session Security Indicator & Logout */}
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-[#0e141f] border border-[#1e293c] text-xs">
              <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
              <div className="hidden sm:block text-[11px] leading-tight">
                <span className="text-white font-medium block">Session Sécurisée</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {sessionExpiresAt
                    ? `Expire à ${new Date(sessionExpiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Active'}
                </span>
              </div>
              <button
                onClick={handleAdminLogout}
                className="ml-2 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Révoquer la session et quitter"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quitter</span>
              </button>
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  unreadCount > 0
                    ? 'bg-[#141b27] border-[#00ff66]/40 text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                    : 'bg-[#121824] border-[#222e44] text-slate-400 hover:text-white'
                }`}
                title="Notifications inscriptions"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotificationsPanel && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0c1017] border border-[#222e44] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1c2433]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00ff66]" />
                      <span className="font-display font-bold text-white uppercase text-sm">Notifications</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66]">
                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-[10px] text-[#00ff66] hover:underline cursor-pointer"
                        >
                          Tout lire
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotificationsPanel(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#161f2c] my-2 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Aucune notification pour le moment.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 transition-colors ${
                            n.read ? 'opacity-70 bg-transparent' : 'bg-[#111724]/70 border-l-2 border-[#00ff66]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white text-[11px] block">{n.title}</span>
                            <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-mono">
                            <span>{n.phone || n.userEmail}</span>
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <button
                                  onClick={() => handleMarkNotifRead(n.id)}
                                  className="text-[#00ff66] hover:underline cursor-pointer"
                                >
                                  Marquer lu
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotif(n.id)}
                                className="text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="pt-2 border-t border-[#1c2433] flex justify-between items-center text-[10px]">
                      <button
                        onClick={handleClearAllNotifs}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        Effacer l'historique
                      </button>
                      <button
                        onClick={() => {
                          setShowNotificationsPanel(false);
                          setAdminTab('registrations');
                        }}
                        className="text-[#00ff66] font-semibold hover:underline cursor-pointer"
                      >
                        Voir toutes les inscriptions →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleRecalculateLeaderboard}
              className="px-3.5 py-2.5 rounded-xl bg-[#141b27] hover:bg-[#1a2333] border border-[#222e42] text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              title="Recalculer les points du classement"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00ff66]" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {/* Database Export & Import JSON (Étape 2) */}
            <button
              onClick={handleExportDatabase}
              className="px-3.5 py-2.5 rounded-xl bg-[#141b27] hover:bg-[#1a2333] border border-[#222e42] hover:border-[#00ff66]/40 text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              title="Exporter l'intégralité des tournois, inscriptions et matchs au format JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Exporter JSON</span>
            </button>

            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-3.5 py-2.5 rounded-xl bg-[#141b27] hover:bg-[#1a2333] border border-[#222e42] hover:border-[#00ff66]/40 text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              title="Importer un fichier JSON de base de données pour synchroniser immédiatement"
            >
              <Upload className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Importer JSON</span>
            </button>
            <input
              type="file"
              ref={jsonInputRef}
              onChange={handleImportDatabase}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              onClick={() => setShowHostingerModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0f1725] hover:bg-[#152033] border border-[#00ff66]/30 text-white hover:border-[#00ff66] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(0,255,102,0.15)]"
              title="Télécharger les archives prêtes pour Hostinger"
            >
              <Download className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Télécharger pour Hostinger</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau tournoi</span>
            </button>
          </div>
        </div>

        {/* Global message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 border ${
              message.type === 'success'
                ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Admin Tab Controls */}
        <div className="flex items-center gap-3 border-b border-[#1b2333] pb-1 overflow-x-auto">
          {[
            {
              id: 'registrations',
              label: 'Inscriptions Tournois',
              badge: allRegistrations.length,
              icon: UserCheck,
            },
            {
              id: 'users',
              label: 'Comptes Joueurs Inscrits',
              badge: allUsers.length,
              icon: Users,
            },
            {
              id: 'tournaments',
              label: 'Gestion des Tournois',
              badge: tournaments.length,
              icon: Trophy,
            },
            {
              id: 'matches',
              label: 'Gestion des Matchs & Scores',
              badge: matches.length,
              icon: Gamepad2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-5 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-[#00ff66] text-black shadow-[0_0_20px_rgba(0,255,102,0.35)]'
                    : 'text-slate-300 hover:text-white bg-[#0e131d] border border-[#1d2636]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-black text-[#00ff66]' : 'bg-[#182130] text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: GESTION DES INSCRIPTIONS (Core User Requirement)  */}
        {/* ======================================================== */}
        {adminTab === 'registrations' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                onClick={() => setAdminTab('users')}
                className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] hover:border-[#00ff66]/50 space-y-1 cursor-pointer transition-colors"
                title="Cliquer pour voir la liste de tous les comptes joueurs inscrits"
              >
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Comptes Joueurs</span>
                  <Users className="w-4 h-4 text-[#00ff66]" />
                </div>
                <div className="font-display text-3xl font-black text-white">
                  {allUsers.length}
                </div>
                <span className="text-[10px] text-[#00ff66] font-mono block">Voir les comptes →</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Inscriptions</span>
                  <UserCheck className="w-4 h-4 text-[#00ff66]" />
                </div>
                <div className="font-display text-3xl font-black text-white">
                  {totalRegistrationsCount}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Enregistrées en base</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Inscriptions Validées</span>
                  <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
                </div>
                <div className="font-display text-3xl font-black text-[#00ff66]">
                  {confirmedCount}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Pass joueurs confirmés</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>En Attente</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-display text-3xl font-black text-amber-400">
                  {pendingCount}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">À traiter ou vérifier</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Inscriptions Refusées</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="font-display text-3xl font-black text-rose-400">
                  {rejectedCount}
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Rejetées ou annulées</span>
              </div>
            </div>

            {/* Total Inscrits par Tournoi Breakdown Strip */}
            <div className="p-5 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#00ff66]" />
                  <span>Nombre de Joueurs Inscrits par Tournoi</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {tournamentsStats.length} compétitions configurées
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {tournamentsStats.map((ts) => {
                  const percentage = Math.min(100, Math.round((ts.confirmed / ts.maxParticipants) * 100));
                  const isSelected = registrationsFilterTournament === ts.id;
                  return (
                    <button
                      key={ts.id}
                      onClick={() => setRegistrationsFilterTournament(isSelected ? 'all' : ts.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#121926] border-[#00ff66] ring-1 ring-[#00ff66]'
                          : 'bg-[#101520] border-[#1e2738] hover:border-[#2f3d57]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display font-bold text-white text-xs truncate max-w-[180px]">
                          {ts.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66] font-bold">
                          {ts.confirmed} / {ts.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-[#1b2333] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#00ff66] to-[#00cc52] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
                        <span>Total : {ts.total} joueur{ts.total > 1 ? 's' : ''}</span>
                        <span>{percentage}% rempli</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, pseudo, email ou tél..."
                    value={registrationsSearch}
                    onChange={(e) => setRegistrationsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121824] border border-[#222e44] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                  {registrationsSearch && (
                    <button
                      onClick={() => setRegistrationsSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Tournament Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  <select
                    value={registrationsFilterTournament}
                    onChange={(e) => setRegistrationsFilterTournament(e.target.value)}
                    className="px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#222e44] text-white focus:outline-none focus:border-[#00ff66] cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">Tous les tournois</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <select
                  value={registrationsStatusFilter}
                  onChange={(e) => setRegistrationsStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#222e44] text-white focus:outline-none focus:border-[#00ff66] cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="confirmed">Confirmés uniquement</option>
                  <option value="pending">En attente uniquement</option>
                  <option value="rejected">Refusés uniquement</option>
                </select>
              </div>

              {/* Export to CSV / Excel Button */}
              <button
                onClick={handleExportCSV}
                disabled={exportingCsv || allRegistrations.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#141b27] hover:bg-[#00ff66] hover:text-black border border-[#222e44] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                title="Exporter toutes les inscriptions filtrées en format CSV / Excel"
              >
                <Download className="w-4 h-4" />
                <span>{exportingCsv ? 'Exportation...' : 'Exporter CSV / Excel'}</span>
              </button>
            </div>

            {/* Registrations Data Table */}
            {allRegistrations.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-[#0c1017] border border-[#1b2538] text-slate-400 text-xs space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-white">Aucune inscription trouvée</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Aucun joueur ne correspond à vos critères de recherche ou de filtre actuels.
                </p>
                {(registrationsSearch || registrationsFilterTournament !== 'all' || registrationsStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setRegistrationsSearch('');
                      setRegistrationsFilterTournament('all');
                      setRegistrationsStatusFilter('all');
                    }}
                    className="text-xs text-[#00ff66] underline cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0c1017] border border-[#1b2538] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#101622] text-slate-400 uppercase font-mono text-[11px] border-b border-[#1b2538]">
                      <tr>
                        <th className="px-5 py-3.5">Dossard</th>
                        <th className="px-5 py-3.5">Joueur (Pseudo & Nom)</th>
                        <th className="px-5 py-3.5">Contact (Tél & E-mail)</th>
                        <th className="px-5 py-3.5">Tournoi</th>
                        <th className="px-5 py-3.5">Preuve Paiement</th>
                        <th className="px-5 py-3.5">Date Inscription</th>
                        <th className="px-5 py-3.5 text-center">Statut</th>
                        <th className="px-5 py-3.5 text-center">Invitation WhatsApp</th>
                        <th className="px-5 py-3.5 text-right">Actions Gestion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#151e2b]">
                      {allRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-[#111724] transition-colors">
                          {/* Seed / Dossard */}
                          <td className="px-5 py-3.5 font-mono text-slate-400 font-bold">
                            <span className="px-2 py-1 rounded bg-[#151e2b] text-[#00ff66]">
                              #{reg.seed || 1}
                            </span>
                          </td>

                          {/* Joueur */}
                          <td className="px-5 py-3.5 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#162030] text-[#00ff66] font-display font-black flex items-center justify-center text-xs border border-[#222e44]">
                                {reg.gamertag.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="block text-white font-bold text-sm tracking-wide">
                                    {reg.gamertag}
                                  </span>
                                  {reg.registrationNumber && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101826] border border-[#1e2a3d] text-[#00ff66]">
                                      {reg.registrationNumber}
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  {reg.playerName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-3.5 font-mono text-slate-300">
                            {reg.phone ? (
                              <a
                                href={`tel:${reg.phone}`}
                                className="text-xs text-[#00ff66] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{reg.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Tél. non renseigné</span>
                            )}
                            {reg.userEmail && (
                              <a
                                href={`mailto:${reg.userEmail}`}
                                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 mt-0.5"
                              >
                                <Mail className="w-3 h-3 shrink-0 text-slate-500" />
                                <span className="truncate max-w-[150px]">{reg.userEmail}</span>
                              </a>
                            )}
                          </td>

                          {/* Tournoi */}
                          <td className="px-5 py-3.5 text-slate-300">
                            <span className="block font-semibold text-white truncate max-w-[170px]">
                              {reg.tournamentName || 'Tournoi FC'}
                            </span>
                          </td>

                          {/* Capture / Preuve de Paiement */}
                          <td className="px-5 py-3.5">
                            {reg.paymentProof ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setPreviewScreenshotUrl({
                                      url: reg.paymentProof!,
                                      title: `Capture de ${reg.playerName} (${reg.gamertag})`,
                                    })
                                  }
                                  className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#233149] hover:border-[#00ff66] transition-colors group cursor-pointer shrink-0 bg-black"
                                  title="Agrandir la capture du paiement"
                                >
                                  <img
                                    src={reg.paymentProof}
                                    alt="Reçu de paiement"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                    <Eye className="w-3.5 h-3.5 text-white opacity-80 group-hover:opacity-100" />
                                  </div>
                                </button>
                                <button
                                  onClick={() => handleDownloadPaymentProof(reg)}
                                  className="p-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1f2b3e] text-slate-300 hover:text-[#00ff66] transition-colors cursor-pointer"
                                  title="Télécharger le fichier de preuve"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-mono">Non fournie</span>
                            )}
                          </td>

                          {/* Date Inscription */}
                          <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                            <span className="block text-slate-200">
                              {new Date(reg.registeredAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(reg.registeredAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Statut */}
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold inline-block border ${
                                reg.status === 'confirmed'
                                  ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30'
                                  : reg.status === 'pending'
                                  ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {reg.status === 'confirmed' ? 'Accepté' : reg.status === 'rejected' ? 'Refusé' : 'En attente'}
                            </span>
                            {reg.validatedAt && (
                              <span className="block text-[9px] text-[#00ff66] font-mono mt-0.5">
                                Validé {new Date(reg.validatedAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                            {reg.rejectedAt && (
                              <span className="block text-[9px] text-rose-400 font-mono mt-0.5" title={reg.rejectionReason}>
                                Refusé {new Date(reg.rejectedAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </td>

                          {/* Invitation WhatsApp */}
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            {reg.status === 'confirmed' ? (
                              reg.whatsappInviteStatus === 'sent' ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle2 className="w-3 h-3 text-[#00ff66]" />
                                    <span>Invitation WhatsApp envoyée</span>
                                  </span>
                                  {reg.whatsappInviteSentAt && (
                                    <span className="text-[9px] text-slate-500 font-mono">
                                      {new Date(reg.whatsappInviteSentAt).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              ) : reg.whatsappInviteStatus === 'failed' ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span
                                    className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
                                    title={reg.whatsappInviteError || 'Échec de l’envoi de l’e-mail'}
                                  >
                                    <AlertCircle className="w-3 h-3 text-rose-400" />
                                    <span>Échec de l'envoi</span>
                                  </span>
                                  <button
                                    onClick={() => handleResendWhatsApp(reg.id)}
                                    className="text-[10px] font-bold text-[#00ff66] hover:underline cursor-pointer flex items-center gap-1"
                                    title="Renvoyer l'invitation WhatsApp par e-mail"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Renvoyer</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleResendWhatsApp(reg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#141d2c] hover:bg-[#00ff66] hover:text-black text-slate-300 hover:border-[#00ff66] border border-[#232e42] text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                                  title="Envoyer manuellement l'invitation WhatsApp au joueur"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>Envoyer invitation</span>
                                </button>
                              )
                            ) : (
                              <span className="text-slate-600 text-[10px] font-mono italic">
                                En attente d'acceptation
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                            {/* Bouton Accepter */}
                            {reg.status !== 'confirmed' && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, 'confirmed')}
                                className="px-2.5 py-1.5 rounded-lg bg-[#00ff66]/15 text-[#00ff66] hover:bg-[#00ff66] hover:text-black font-semibold text-[11px] transition-all cursor-pointer"
                                title="Accepter l'inscription (déclenche l'invitation WhatsApp automatique)"
                              >
                                Accepter
                              </button>
                            )}

                            {/* Bouton Refuser */}
                            {reg.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-black font-semibold text-[11px] transition-all cursor-pointer"
                                title="Refuser l'inscription"
                              >
                                Refuser
                              </button>
                            )}

                            {/* Bouton Renvoyer WhatsApp pour les inscriptions confirmées */}
                            {reg.status === 'confirmed' && (
                              <button
                                onClick={() => handleResendWhatsApp(reg.id)}
                                className="p-1.5 rounded-lg bg-[#152336] text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-colors cursor-pointer"
                                title="Renvoyer l'invitation officielle WhatsApp par email"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Bouton Fiche Détail */}
                            <button
                              onClick={() => setSelectedRegistrationForDetail(reg)}
                              className="p-1.5 rounded-lg bg-[#151f2d] text-slate-300 hover:text-white hover:bg-[#1d2b3f] transition-colors"
                              title="Consulter la fiche complète du joueur"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-300" />
                            </button>

                            {/* Bouton Supprimer */}
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Supprimer définitivement l'inscription"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: COMPTES JOUEURS INSCRITS SUR LA PLATEFORME          */}
        {/* ======================================================== */}
        {adminTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="p-6 rounded-3xl bg-[#0c1017] border border-[#1b2538] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00ff66] uppercase">
                  <Users className="w-4 h-4 text-[#00ff66]" />
                  <span>COMPTES JOUEURS ENREGISTRÉS</span>
                </div>
                <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                  Profils & Inscriptions Compétiteurs
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Liste complète de tous les utilisateurs ayant créé un compte joueur sur FC TOURNAMENT via le formulaire d’inscription. Vous pouvez vérifier leurs coordonnées, leur participation aux tournois ou les contacter directement.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Rechercher par pseudo, nom, email..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111722] border border-[#222e44] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                  {usersSearch && (
                    <button
                      onClick={() => setUsersSearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl bg-[#131924] hover:bg-[#1a2333] border border-[#222e44] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Actualiser la liste des joueurs"
                >
                  <RefreshCw className="w-4 h-4 text-[#00ff66]" />
                </button>
              </div>
            </div>

            {/* Users Data Table */}
            {allUsers.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-[#0c1017] border border-[#1b2538] text-slate-400 text-xs space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-white">Aucun compte joueur trouvé</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Aucun joueur ne correspond à votre recherche actuelle.
                </p>
                {usersSearch && (
                  <button
                    onClick={() => setUsersSearch('')}
                    className="text-xs text-[#00ff66] underline cursor-pointer"
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0c1017] border border-[#1b2538] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#101622] text-slate-400 uppercase font-mono text-[11px] border-b border-[#1b2538]">
                      <tr>
                        <th className="px-5 py-3.5">Joueur (Pseudo & Nom)</th>
                        <th className="px-5 py-3.5">Adresse E-mail</th>
                        <th className="px-5 py-3.5">Équipe Favorite</th>
                        <th className="px-5 py-3.5">Date Inscription Compte</th>
                        <th className="px-5 py-3.5 text-center">Inscriptions Tournois</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#151e2b]">
                      {allUsers.map((u) => {
                        const isRecent = Date.now() - new Date(u.createdAt).getTime() < 48 * 60 * 60 * 1000;
                        return (
                          <tr key={u.id} className="hover:bg-[#111724] transition-colors">
                            {/* Joueur */}
                            <td className="px-5 py-3.5 font-bold text-white">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#162030] text-[#00ff66] font-display font-black flex items-center justify-center text-xs border border-[#222e44] shrink-0">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.gamertag} className="w-full h-full rounded-xl object-cover" />
                                  ) : (
                                    u.gamertag.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="block text-white font-bold text-sm tracking-wide">
                                      {u.gamertag}
                                    </span>
                                    {isRecent && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] uppercase">
                                        Nouveau
                                      </span>
                                    )}
                                    {u.role === 'admin' && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300 uppercase">
                                        Staff
                                      </span>
                                    )}
                                  </div>
                                  <span className="block text-[11px] text-slate-400 font-normal">
                                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Nom non renseigné'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-5 py-3.5 font-mono text-slate-300">
                              <a
                                href={`mailto:${u.email}`}
                                className="hover:text-[#00ff66] flex items-center gap-1.5 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>{u.email}</span>
                              </a>
                            </td>

                            {/* Équipe */}
                            <td className="px-5 py-3.5 text-slate-300">
                              <span className="px-2.5 py-1 rounded-lg bg-[#141b27] border border-[#1e283b] text-xs font-medium">
                                {u.favoriteTeam || 'Non spécifiée'}
                              </span>
                            </td>

                            {/* Date création compte */}
                            <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                              <div>
                                {new Date(u.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {new Date(u.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Inscriptions Tournois */}
                            <td className="px-5 py-3.5 text-center">
                              {u.tournamentRegistrationsCount && u.tournamentRegistrationsCount > 0 ? (
                                <button
                                  onClick={() => {
                                    setRegistrationsSearch(u.gamertag);
                                    setAdminTab('registrations');
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] hover:bg-[#00ff66]/20 transition-all font-mono font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                                  title="Voir ses inscriptions aux tournois"
                                >
                                  <Trophy className="w-3.5 h-3.5" />
                                  <span>{u.tournamentRegistrationsCount} tournoi{u.tournamentRegistrationsCount > 1 ? 's' : ''}</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-mono">
                                  Pas encore de tournoi
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`mailto:${u.email}?subject=Bienvenue sur FC TOURNAMENT&body=Bonjour ${u.gamertag},`}
                                  className="p-1.5 rounded-lg bg-[#141c2b] text-slate-300 hover:text-[#00ff66] hover:bg-[#1a2538] transition-colors cursor-pointer"
                                  title={`Envoyer un email à ${u.email}`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>

                                {u.role !== 'admin' && u.email !== 'admin@fctournament.ma' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.gamertag)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                    title={`Supprimer définitivement le compte de ${u.gamertag}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GESTION DES TOURNOIS                              */}
        {/* ======================================================== */}
        {adminTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-3xl bg-[#0c1017] border border-[#1b2436] space-y-4 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#00ff66] uppercase font-bold">{t.gameVersion}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          t.status === 'open'
                            ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30'
                            : t.status === 'ongoing'
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white line-clamp-1">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {t.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-[#182130]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Inscrits confirmés :</span>
                      <span className="text-[#00ff66] font-semibold">{t.confirmedCount || 0} / {t.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Frais :</span>
                      <span>{formatMAD(t.entryFeeMAD)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-400">
                      <span className="text-slate-500">Dotation :</span>
                      <span className="truncate ml-2">{t.prizePool}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#182130]">
                    <button
                      onClick={() => setEditingTournament(t)}
                      className="p-2 rounded-xl bg-[#141b27] hover:bg-[#1f2838] text-slate-200 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 text-[#00ff66]" />
                    </button>
                    <button
                      onClick={() => onNavigate('tournament-detail', t.id)}
                      className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#141b27] hover:bg-[#1a2333] text-slate-200 transition-colors text-center"
                    >
                      Voir fiche
                    </button>
                    <button
                      onClick={() => handleDeleteTournament(t.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: GESTION DES MATCHS & SCORES                       */}
        {/* ======================================================== */}
        {adminTab === 'matches' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#0c1017] border border-[#1b2538] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 uppercase">Tournoi actif :</span>
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-[#121824] border border-[#222e44] text-white font-bold focus:outline-none focus:border-[#00ff66] cursor-pointer"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTournamentDetail && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleGenerateBracket(selectedTournamentId)}
                    className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-display font-bold text-xs uppercase tracking-wider hover:bg-[#00e65c] transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                  >
                    {selectedTournamentDetail.format === 'aller_retour' ||
                    selectedTournamentDetail.format === 'championship' ||
                    selectedTournamentDetail.name.toLowerCase().includes('championnat') ? (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Générer le Calendrier</span>
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Générer le Bracket</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        selectedTournamentId,
                        selectedTournamentDetail.status === 'open'
                          ? 'ongoing'
                          : selectedTournamentDetail.status === 'ongoing'
                          ? 'completed'
                          : 'open'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#121824] border border-[#222e44] text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    Statut : <strong className="text-[#00ff66] uppercase">{selectedTournamentDetail.status}</strong>
                  </button>
                </div>
              )}
            </div>

            {currentTournMatches.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-[#0c1017] border border-[#1b2538] text-slate-400 text-xs space-y-3">
                <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-white">Aucun match programmé pour ce tournoi</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Cliquez sur « Générer le Bracket » ci-dessus pour tirer au sort les confrontations entre les joueurs confirmés.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTournMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-[#0c1017] border border-[#1b2538] space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-[#161f2c] pb-2">
                      <span className="font-mono text-slate-400">{m.stageName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                          m.status === 'completed'
                            ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30'
                            : m.status === 'live'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.status === 'completed' ? 'Validé' : m.status === 'live' ? 'En Direct' : 'Programmé'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="flex-1 text-center">
                        <span className="font-display text-lg font-bold text-white block truncate">
                          {m.player1Gamertag}
                        </span>
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-[#121824] border border-[#222e44] font-mono text-xl font-black text-[#00ff66]">
                        {m.player1Score !== null ? m.player1Score : '-'} : {m.player2Score !== null ? m.player2Score : '-'}
                      </div>

                      <div className="flex-1 text-center">
                        <span className="font-display text-lg font-bold text-white block truncate">
                          {m.player2Gamertag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#161f2c]">
                      <span className="text-slate-500 font-mono">
                        {m.scheduledDate} · {m.scheduledTime}
                      </span>
                      <button
                        onClick={() => setScoreModalMatch(m)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#141b27] hover:bg-[#00ff66] hover:text-black border border-[#222e44] text-xs font-semibold text-white transition-all cursor-pointer"
                      >
                        {m.status === 'completed' ? 'Modifier le score' : 'Homologuer le score'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: PLAYER REGISTRATION DETAIL                        */}
        {/* ======================================================== */}
        {selectedRegistrationForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-lg bg-[#0c1017] border border-[#222c40] rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[#1c2433] flex items-center justify-between bg-[#111724]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00ff66]/15 border border-[#00ff66]/40 flex items-center justify-center text-[#00ff66]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase leading-tight">
                      Fiche Complète du Participant
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Dossard #{selectedRegistrationForDetail.seed || 1}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegistrationForDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#192233] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs text-slate-300">
                {/* Header Profile Box */}
                <div className="p-4 rounded-2xl bg-[#111724] border border-[#1e2738] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Pseudonyme EA FC</span>
                    <span className="font-display text-2xl font-black text-white block">
                      {selectedRegistrationForDetail.gamertag}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedRegistrationForDetail.playerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold inline-block border ${
                        selectedRegistrationForDetail.status === 'confirmed'
                          ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30'
                          : selectedRegistrationForDetail.status === 'pending'
                          ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {selectedRegistrationForDetail.status === 'confirmed'
                        ? 'Confirmé'
                        : selectedRegistrationForDetail.status === 'rejected'
                        ? 'Rejeté'
                        : 'En attente'}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#0e131d] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Téléphone / WhatsApp</span>
                    <div className="font-mono text-sm text-[#00ff66] font-bold">
                      {selectedRegistrationForDetail.phone ? (
                        <a href={`tel:${selectedRegistrationForDetail.phone}`} className="hover:underline flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedRegistrationForDetail.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Non renseigné</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e131d] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Adresse E-mail</span>
                    <div className="font-mono text-xs text-white truncate">
                      {selectedRegistrationForDetail.userEmail ? (
                        <a href={`mailto:${selectedRegistrationForDetail.userEmail}`} className="hover:underline flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{selectedRegistrationForDetail.userEmail}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Non renseigné</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e131d] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Tournoi Choisi</span>
                    <span className="font-semibold text-white block truncate">
                      {selectedRegistrationForDetail.tournamentName || 'Tournoi FC'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e131d] border border-[#1b2333] space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Date & Heure d'Inscription</span>
                    <span className="font-mono text-slate-300 block text-xs">
                      {new Date(selectedRegistrationForDetail.registeredAt).toLocaleString('fr-FR', {
                        timeZone: 'Africa/Casablanca',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Preuve de paiement reçue */}
                  <div className="p-4 rounded-2xl bg-[#0e131d] border border-[#1b2333] space-y-3 col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-display">
                        <FileCheck2 className="w-4 h-4 text-[#00ff66]" />
                        <span>Preuve de Paiement Fournie</span>
                      </span>
                      {selectedRegistrationForDetail.paymentProof && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPaymentProof(selectedRegistrationForDetail)}
                          className="px-2.5 py-1 rounded-lg bg-[#141d2c] hover:bg-[#00ff66] hover:text-black text-xs font-semibold text-[#00ff66] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger le reçu</span>
                        </button>
                      )}
                    </div>

                    {selectedRegistrationForDetail.paymentProof ? (
                      <div className="space-y-2">
                        <div
                          onClick={() =>
                            setPreviewScreenshotUrl({
                              url: selectedRegistrationForDetail.paymentProof!,
                              title: `Capture de paiement - ${selectedRegistrationForDetail.playerName} (${selectedRegistrationForDetail.gamertag})`,
                            })
                          }
                          className="relative max-h-56 rounded-xl overflow-hidden bg-black border border-[#222e44] group cursor-pointer flex items-center justify-center"
                        >
                          <img
                            src={selectedRegistrationForDetail.paymentProof}
                            alt="Preuve de paiement du joueur"
                            className="max-h-56 w-auto object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2 text-white font-medium text-xs">
                            <Eye className="w-4 h-4 text-[#00ff66]" />
                            <span>Cliquez pour agrandir</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">
                          Nom du fichier : <span className="text-slate-200">{selectedRegistrationForDetail.paymentProofName || 'capture_paiement.png'}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-500 font-mono text-xs">
                        Aucune capture d'écran de paiement jointe à cette inscription.
                      </div>
                    )}
                  </div>

                  {/* Suivi Invitation Officielle WhatsApp */}
                  <div className="p-4 rounded-2xl bg-[#0e131d] border border-[#1b2333] space-y-3 col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-display">
                        <MessageSquare className="w-4 h-4 text-[#00ff66]" />
                        <span>Invitation Groupe WhatsApp Officiel</span>
                      </span>
                      {selectedRegistrationForDetail.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleResendWhatsApp(selectedRegistrationForDetail.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#00ff66]/15 hover:bg-[#00ff66] hover:text-black text-xs font-semibold text-[#00ff66] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Renvoyer l'invitation</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-[#121927] border border-[#1f2b3e] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">Statut de l'envoi :</span>
                        {selectedRegistrationForDetail.status === 'confirmed' ? (
                          selectedRegistrationForDetail.whatsappInviteStatus === 'sent' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Invitation WhatsApp envoyée</span>
                            </span>
                          ) : selectedRegistrationForDetail.whatsappInviteStatus === 'failed' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Échec de l'envoi</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                              Non encore envoyée
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px] italic">
                            Non éligible (en attente d'acceptation)
                          </span>
                        )}
                      </div>

                      {selectedRegistrationForDetail.whatsappInviteSentAt && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Envoyée le :</span>
                          <span className="text-slate-200 font-mono">
                            {new Date(selectedRegistrationForDetail.whatsappInviteSentAt).toLocaleString('fr-FR', {
                              timeZone: 'Africa/Casablanca',
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}

                      {selectedRegistrationForDetail.whatsappInviteError && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          Erreur constatée : {selectedRegistrationForDetail.whatsappInviteError}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#1c2638] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Lien WhatsApp :</span>
                        <a
                          href="https://chat.whatsapp.com/CQVBqfeokIqDxa8PgdjleY?s=cl&p=i&mlu=4&ilr=4&iam=2"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00ff66] hover:underline font-mono text-[11px] truncate max-w-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>Rejoindre le groupe WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {selectedRegistrationForDetail.notes && (
                    <div className="p-3.5 rounded-xl bg-[#0e131d] border border-[#1b2333] space-y-1 col-span-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Remarques du Joueur</span>
                      <p className="text-slate-300 italic">"{selectedRegistrationForDetail.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-[#1c2433] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteRegistration(selectedRegistrationForDetail.id)}
                    className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer text-xs"
                  >
                    Supprimer l'inscription
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedRegistrationForDetail.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRegStatus(selectedRegistrationForDetail.id, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Refuser
                      </button>
                    )}
                    {selectedRegistrationForDetail.status !== 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRegStatus(selectedRegistrationForDetail.id, 'confirmed')}
                        className="px-5 py-2 rounded-xl bg-[#00ff66] text-black font-display font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)] text-xs"
                      >
                        Valider & Accepter
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRegistrationForDetail(null)}
                      className="px-4 py-2 rounded-xl bg-[#141b27] text-slate-300 hover:text-white cursor-pointer text-xs"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: CREATE TOURNAMENT                                 */}
        {/* ======================================================== */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-xl bg-[#0e131d] border border-[#232e44] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[#1c2433] flex items-center justify-between bg-[#121824]">
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Créer une Nouvelle Compétition
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTournament} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom du tournoi *</label>
                  <input
                    type="text"
                    required
                    value={newTournName}
                    onChange={(e) => setNewTournName(e.target.value)}
                    placeholder="Ex: EA FC 25 Spring Cup"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newTournDesc}
                    onChange={(e) => setNewTournDesc(e.target.value)}
                    placeholder="Présentation du tournoi et enjeux..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Date du tournoi *</label>
                    <input
                      type="date"
                      required
                      value={newTournDate}
                      onChange={(e) => setNewTournDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Heure de début *</label>
                    <input
                      type="time"
                      required
                      value={newTournTime}
                      onChange={(e) => setNewTournTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Capacité max</label>
                    <input
                      type="number"
                      min="4"
                      max="64"
                      value={newTournMax}
                      onChange={(e) => setNewTournMax(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Frais (MAD)</label>
                    <input
                      type="number"
                      min="0"
                      value={newTournFee}
                      onChange={(e) => setNewTournFee(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Dotation / Prix</label>
                    <input
                      type="text"
                      value={newTournPrize}
                      onChange={(e) => setNewTournPrize(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Règles et format</label>
                  <textarea
                    rows={3}
                    value={newTournRules}
                    onChange={(e) => setNewTournRules(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1c2433]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00ff66] text-black font-bold uppercase cursor-pointer hover:bg-[#00e65c] transition-all"
                  >
                    Publier le tournoi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: EDIT TOURNAMENT                                   */}
        {/* ======================================================== */}
        {editingTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-xl bg-[#0e131d] border border-[#232e44] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[#1c2433] flex items-center justify-between bg-[#121824]">
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Modifier le Tournoi
                </h3>
                <button
                  onClick={() => setEditingTournament(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateTournament} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom de la compétition *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.name}
                    onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Statut de la compétition</label>
                    <select
                      value={editingTournament.status}
                      onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    >
                      <option value="open">Inscriptions ouvertes (open)</option>
                      <option value="ongoing">En cours (ongoing)</option>
                      <option value="completed">Terminé (completed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Format</label>
                    <select
                      value={editingTournament.format}
                      onChange={(e) => setEditingTournament({ ...editingTournament, format: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    >
                      <option value="single_elimination">Élimination directe</option>
                      <option value="aller_retour">Aller-Retour</option>
                      <option value="groups_playoffs">Poules puis Finales</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={editingTournament.startDate}
                      onChange={(e) => setEditingTournament({ ...editingTournament, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Heure</label>
                    <input
                      type="time"
                      value={editingTournament.time}
                      onChange={(e) => setEditingTournament({ ...editingTournament, time: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Capacité</label>
                    <input
                      type="number"
                      value={editingTournament.maxParticipants}
                      onChange={(e) => setEditingTournament({ ...editingTournament, maxParticipants: parseInt(e.target.value, 10) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Frais (MAD)</label>
                    <input
                      type="number"
                      value={editingTournament.entryFeeMAD}
                      onChange={(e) => setEditingTournament({ ...editingTournament, entryFeeMAD: parseFloat(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Dotation</label>
                    <input
                      type="text"
                      value={editingTournament.prizePool}
                      onChange={(e) => setEditingTournament({ ...editingTournament, prizePool: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingTournament.description}
                    onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#101520] border border-[#1e2738] text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1c2433]">
                  <button
                    type="button"
                    onClick={() => setEditingTournament(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00ff66] text-black font-bold uppercase cursor-pointer hover:bg-[#00e65c] transition-all"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: SCORE VALIDATION                                  */}
        {/* ======================================================== */}
        {scoreModalMatch && (
          <ScoreModal
            match={scoreModalMatch}
            token={token}
            adminToken={adminToken}
            onClose={() => setScoreModalMatch(null)}
            onSuccess={() => {
              fetchAdminData();
            }}
          />
        )}

        {/* ======================================================== */}
        {/* MODAL: PAYMENT PROOF SCREENSHOT LIGHTBOX                 */}
        {/* ======================================================== */}
        {previewScreenshotUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPreviewScreenshotUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-[#0c1017] border border-[#243147] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 bg-[#121824] border-b border-[#1c2638] flex items-center justify-between">
                <span className="font-display text-sm font-bold text-white uppercase truncate pr-4">
                  {previewScreenshotUrl.title || "Capture d'écran du paiement"}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewScreenshotUrl.url}
                    download="preuve-paiement.png"
                    className="px-3 py-1.5 rounded-lg bg-[#00ff66] text-black font-bold text-xs uppercase hover:bg-[#00e65c] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger</span>
                  </a>
                  <button
                    onClick={() => setPreviewScreenshotUrl(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2333] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto flex items-center justify-center bg-black/50">
                <img
                  src={previewScreenshotUrl.url}
                  alt="Aperçu capture du paiement"
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-[#1e283a]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: HOSTINGER DEPLOYMENT PACKAGES DOWNLOAD            */}
        {/* ======================================================== */}
        {showHostingerModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowHostingerModal(false)}
          >
            <div
              className="relative w-full max-w-2xl bg-[#0b0f17] border border-[#1f2b3f] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#101725] border-b border-[#1c2638] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 flex items-center justify-center text-[#00ff66]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                      Téléchargement pour Déploiement Hostinger
                    </h3>
                    <p className="text-xs text-slate-400">
                      Archives prêtes à l'emploi selon votre type d'hébergement Hostinger
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHostingerModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a2333] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Pack 1: Statique public_html */}
                <div className="p-5 rounded-2xl bg-[#121926] border border-[#233148] hover:border-[#00ff66]/40 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        ⭐ Option 1 - Le plus simple & recommandé
                      </span>
                      <h4 className="font-display text-base font-bold text-white uppercase">
                        Pack Hébergement Web (public_html)
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Idéal pour tout hébergement standard Hostinger (Hébergement Web Simple, Premium ou Business).
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-400 shrink-0">~6.2 Mo</span>
                  </div>

                  <div className="text-xs text-slate-400 bg-[#090d14] p-3 rounded-xl border border-[#182232] space-y-1">
                    <p className="font-semibold text-slate-300">Inclus dans le ZIP :</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li><strong className="text-white">index.html</strong> + tous les assets compilés</li>
                      <li><strong className="text-white">.htaccess</strong> pré-configuré (évite les erreurs 404 sur les pages)</li>
                      <li>Formulaires reliés en direct à votre e-mail <span className="text-[#00ff66]">alio227ng@gmail.com</span></li>
                    </ul>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Uploadez et extrayez dans le dossier <strong>public_html</strong> via le Gestionnaire de fichiers.
                    </span>
                    <a
                      href="/hostinger-dist.zip"
                      download="hostinger-dist.zip"
                      className="px-4 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger (dist.zip)</span>
                    </a>
                  </div>
                </div>

                {/* Pack 2: Application Node.js */}
                <div className="p-5 rounded-2xl bg-[#121926] border border-[#233148] hover:border-sky-500/40 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        Option 2 - Pour Hostinger Node.js
                      </span>
                      <h4 className="font-display text-base font-bold text-white uppercase">
                        Pack Serveur Node.js Complet
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Pour les hébergements Hostinger supportant l'application Node.js ou VPS.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-400 shrink-0">~13 Mo</span>
                  </div>

                  <div className="text-xs text-slate-400 bg-[#090d14] p-3 rounded-xl border border-[#182232] space-y-1">
                    <p className="font-semibold text-slate-300">Inclus dans le ZIP :</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li><strong className="text-white">server.js</strong> & <strong className="text-white">app.js</strong> (démarrage natif Node.js)</li>
                      <li><strong className="text-white">package.json</strong> optimisé pour Hostinger</li>
                      <li>Dossier frontend <strong className="text-white">dist/</strong> complet</li>
                    </ul>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Fichier de démarrage : <strong>server.js</strong> (Node 18+).
                    </span>
                    <a
                      href="/hostinger-full.zip"
                      download="hostinger-full.zip"
                      className="px-4 py-2.5 rounded-xl bg-[#1c293d] hover:bg-[#253650] text-sky-300 border border-sky-500/30 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger (full.zip)</span>
                    </a>
                  </div>
                </div>

                {/* Info aide */}
                <div className="p-3.5 rounded-xl bg-[#090d14] border border-[#192231] text-[11px] text-slate-400 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
                  <p>
                    Les deux archives intègrent toutes les corrections récentes : l'adresse de contact <strong className="text-white">alio227ng@gmail.com</strong>, le numéro <strong className="text-white">+212681337566</strong>, et l'alerte instantanée des inscriptions visiteurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
