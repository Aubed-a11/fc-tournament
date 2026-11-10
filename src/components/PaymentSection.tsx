import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard,
  Copy,
  Check,
  UploadCloud,
  FileCheck2,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  Smartphone,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { PaymentMethodId, PaymentSubmission, Tournament } from '../types/index.ts';

interface PaymentSectionProps {
  tournaments?: Tournament[];
  onNavigate?: (page: string, param?: string) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ tournaments = [], onNavigate }) => {
  const { user, token } = useAuth();

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('cih');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form fields
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || 'tourn_spring_2026');
  const [gamertag, setGamertag] = useState(user?.gamertag || '');
  const [playerName, setPlayerName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // File proof upload
  const [proofData, setProofData] = useState<string | null>(null);
  const [proofName, setProofName] = useState('');
  const [proofSize, setProofSize] = useState('');
  const [proofType, setProofType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // User's previous payment submissions
  const [myPayments, setMyPayments] = useState<PaymentSubmission[]>([]);
  const [loadingMyPayments, setLoadingMyPayments] = useState(false);

  // Sync with user auth state
  useEffect(() => {
    if (user) {
      if (!gamertag) setGamertag(user.gamertag);
      if (!playerName) setPlayerName(`${user.firstName} ${user.lastName}`);
      if (!userEmail) setUserEmail(user.email);
    }
  }, [user]);

  // Load user payments if logged in
  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      if (!token) {
        // Load from local store
        const list = await apiClient.getMyPayments(null);
        if (isMounted) setMyPayments(list);
        return;
      }
      setLoadingMyPayments(true);
      try {
        const list = await apiClient.getMyPayments(token);
        if (isMounted) setMyPayments(list);
      } finally {
        if (isMounted) setLoadingMyPayments(false);
      }
    }
    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [token, submitSuccess]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleFileProcess = (file: File) => {
    setFileError(null);
    setSubmitError(null);

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = validImageTypes.includes(file.type) || /\.(jpg|jpeg|png)$/i.test(file.name);

    if (!isImage && !isPdf) {
      setFileError('Format non supporté. Veuillez joindre une capture d’écran (JPG, JPEG, PNG) ou un fichier PDF.');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Le fichier est trop volumineux (maximum 10 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofData(reader.result);
        setProofName(file.name);
        setProofType(file.type || (isPdf ? 'application/pdf' : 'image/jpeg'));
        const formattedSize =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
            : `${Math.round(file.size / 1024)} Ko`;
        setProofSize(formattedSize);
      }
    };
    reader.onerror = () => {
      setFileError('Erreur lors de la lecture du fichier justificatif.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProofData(null);
    setProofName('');
    setProofSize('');
    setProofType('');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!gamertag.trim()) {
      setSubmitError('Veuillez renseigner votre pseudo (Gamertag).');
      return;
    }

    if (!userEmail.trim()) {
      setSubmitError('Veuillez renseigner votre adresse e-mail pour le suivi.');
      return;
    }

    if (!proofData) {
      setSubmitError('Veuillez télécharger votre capture d’écran ou reçu PDF de paiement avant de soumettre.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.submitPaymentProof(
        {
          paymentMethod: selectedMethod,
          proofData,
          proofName,
          proofType,
          proofSize,
          tournamentId: selectedTournamentId,
          gamertag: gamertag.trim(),
          playerName: playerName.trim() || gamertag.trim(),
          userEmail: userEmail.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        },
        token
      );

      if (res.success) {
        setSubmitSuccess(res.message);
        // Reset file input
        setProofData(null);
        setProofName('');
        setProofSize('');
        setProofType('');
        setNotes('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh local list
        const updated = await apiClient.getMyPayments(token);
        setMyPayments(updated);
      } else {
        setSubmitError(res.error || "Erreur lors de l'enregistrement de votre justificatif.");
      }
    } catch {
      setSubmitError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTourn = tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];
  const activeFee = selectedTourn?.entryFeeMAD ? `${selectedTourn.entryFeeMAD} MAD` : '49.99 MAD';

  return (
    <section id="paiement" className="py-16 bg-[#080c14] border-t border-b border-[#172033] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 text-xs font-mono font-bold text-[#00ff66] uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Transfert Manuel & Validation Administrateur</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
            Effectuer mon paiement
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Réglez vos frais de participation ({activeFee}) en toute sécurité par virement bancaire ou Mobile Money,
            puis déposez votre reçu ci-dessous pour vérification manuelle par l'administrateur.
          </p>
        </div>

        {/* 4-Steps Process Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            {
              step: '1',
              title: 'Choisir le moyen',
              desc: 'Sélectionnez CIH Bank, BMCE Bank ou MTN MoMo.',
            },
            {
              step: '2',
              title: 'Copier les infos',
              desc: 'Copiez le RIB officiel ou le numéro en 1 clic.',
            },
            {
              step: '3',
              title: 'Transférer',
              desc: 'Faites le virement depuis votre application bancaire.',
            },
            {
              step: '4',
              title: 'Déposer le reçu',
              desc: 'Joignez votre capture ou PDF pour validation.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl bg-[#0d131f] border border-[#1b2538] flex items-start gap-4 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66] font-display font-black text-base flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: Payment Details on Left & Upload Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: 3 PAYMENT OPTIONS (RIB / MOBILE MONEY)         */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#00ff66] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00ff66]" />
              <span>1. Coordonnées de Paiement Officielles</span>
            </h3>

            {/* Option 1: CIH BANK */}
            <div
              onClick={() => setSelectedMethod('cih')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                selectedMethod === 'cih'
                  ? 'bg-[#101726] border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.15)] ring-1 ring-[#00ff66]'
                  : 'bg-[#0d121c] border-[#1c2638] hover:border-[#2a384f]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xs font-display">
                    CIH
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">CIH BANK</span>
                    <span className="text-[10px] text-slate-400 font-mono">Virement bancaire (Maroc)</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMethod === 'cih' ? 'bg-[#00ff66] text-black' : 'bg-[#182232] text-slate-400'
                  }`}
                >
                  {selectedMethod === 'cih' ? 'Sélectionné' : 'Choisir'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-[#090d14] p-3 rounded-xl border border-[#192232]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-400 text-[11px]">Bénéficiaire :</span>
                  <span className="text-white font-bold">ALIO LABBO</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1 border-t border-[#161d2a]">
                  <span className="text-slate-400 text-[11px]">RIB :</span>
                  <div className="flex items-center justify-between gap-2 bg-[#121926] px-2.5 py-1.5 rounded-lg border border-[#222e42]">
                    <span className="text-[#00ff66] font-bold text-xs tracking-wider select-all break-all">
                      6046878211016200
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard('6046878211016200', 'cih_rib');
                      }}
                      className="px-2.5 py-1 rounded bg-[#182335] hover:bg-[#00ff66] hover:text-black text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'cih_rib' ? (
                        <>
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span className="text-[#00ff66]">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier le RIB</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: BMCE BANK */}
            <div
              onClick={() => setSelectedMethod('bmce')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                selectedMethod === 'bmce'
                  ? 'bg-[#101726] border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.15)] ring-1 ring-[#00ff66]'
                  : 'bg-[#0d121c] border-[#1c2638] hover:border-[#2a384f]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs font-display">
                    BMCE
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">BMCE BANK (Bank of Africa)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Virement bancaire (Maroc)</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMethod === 'bmce' ? 'bg-[#00ff66] text-black' : 'bg-[#182232] text-slate-400'
                  }`}
                >
                  {selectedMethod === 'bmce' ? 'Sélectionné' : 'Choisir'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-[#090d14] p-3 rounded-xl border border-[#192232]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-400 text-[11px]">Bénéficiaire :</span>
                  <span className="text-white font-bold">DAMBADE GISLAIN</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1 border-t border-[#161d2a]">
                  <span className="text-slate-400 text-[11px]">RIB :</span>
                  <div className="flex items-center justify-between gap-2 bg-[#121926] px-2.5 py-1.5 rounded-lg border border-[#222e42]">
                    <span className="text-[#00ff66] font-bold text-xs tracking-wider select-all break-all">
                      011570000007200000447220
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard('011570000007200000447220', 'bmce_rib');
                      }}
                      className="px-2.5 py-1 rounded bg-[#182335] hover:bg-[#00ff66] hover:text-black text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'bmce_rib' ? (
                        <>
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span className="text-[#00ff66]">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier le RIB</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 3: MTN MOMO */}
            <div
              onClick={() => setSelectedMethod('mtn_momo')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                selectedMethod === 'mtn_momo'
                  ? 'bg-[#101726] border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.15)] ring-1 ring-[#00ff66]'
                  : 'bg-[#0d121c] border-[#1c2638] hover:border-[#2a384f]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-black text-xs font-display">
                    MTN
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">MTN MOMO</span>
                    <span className="text-[10px] text-slate-400 font-mono">Mobile Money Transfer</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    selectedMethod === 'mtn_momo' ? 'bg-[#00ff66] text-black' : 'bg-[#182232] text-slate-400'
                  }`}
                >
                  {selectedMethod === 'mtn_momo' ? 'Sélectionné' : 'Choisir'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-[#090d14] p-3 rounded-xl border border-[#192232]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-400 text-[11px]">Bénéficiaire :</span>
                  <span className="text-white font-bold">ADJAKPA Brice</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1 border-t border-[#161d2a]">
                  <span className="text-slate-400 text-[11px]">Numéro MoMo :</span>
                  <div className="flex items-center justify-between gap-2 bg-[#121926] px-2.5 py-1.5 rounded-lg border border-[#222e42]">
                    <span className="text-[#00ff66] font-bold text-sm tracking-wider select-all">
                      0162403071
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard('0162403071', 'mtn_num');
                      }}
                      className="px-2.5 py-1 rounded bg-[#182335] hover:bg-[#00ff66] hover:text-black text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'mtn_num' ? (
                        <>
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span className="text-[#00ff66]">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier le numéro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-[#0b101a] border border-[#1a2334] flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-[#00ff66] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-white font-semibold block">Sécurité & Confidentialité</span>
                <p className="text-[11px] leading-relaxed">
                  Aucune coordonnée bancaire n'est demandée sur notre plateforme. Le transfert s’effectue entièrement
                  hors ligne via votre banque ou votre opérateur Mobile Money.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: PROOF SUBMISSION FORM                         */}
          {/* ============================================================ */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f17] border border-[#1d273a] shadow-2xl space-y-6">
              <div className="border-b border-[#182132] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    2. Déposer mon justificatif de paiement
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Téléchargez votre capture d'écran ou fichier PDF pour validation par le staff.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/25 text-[#00ff66] font-mono text-xs font-bold">
                  <span>Frais : {activeFee}</span>
                </div>
              </div>

              {submitSuccess && (
                <div className="p-4 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] text-xs flex items-start gap-3 shadow-lg">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block text-sm">Justificatif envoyé avec succès !</span>
                    <p className="text-slate-300 leading-relaxed">{submitSuccess}</p>
                    <span className="text-[11px] font-mono text-[#00ff66] block pt-1">
                      Votre inscription passera au statut « Confirmé » dès vérification par l’administrateur.
                    </span>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Erreur de transmission</span>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitProof} className="space-y-5">
                {/* Tournoi associé & Moyen choisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tournoi concerné <span className="text-[#00ff66]">*</span>
                    </label>
                    <select
                      value={selectedTournamentId}
                      onChange={(e) => setSelectedTournamentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white focus:outline-none focus:border-[#00ff66]"
                    >
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.entryFeeMAD || 49.99} MAD)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Moyen de paiement utilisé <span className="text-[#00ff66]">*</span>
                    </label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value as PaymentMethodId)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white focus:outline-none focus:border-[#00ff66]"
                    >
                      <option value="cih">CIH BANK (ALIO LABBO)</option>
                      <option value="bmce">BMCE BANK (DAMBADE GISLAIN)</option>
                      <option value="mtn_momo">MTN MOMO (ADJAKPA Brice)</option>
                    </select>
                  </div>
                </div>

                {/* Identité joueur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Votre Gamertag (Pseudo FC) <span className="text-[#00ff66]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amine_FC"
                      value={gamertag}
                      onChange={(e) => setGamertag(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Nom et prénom du joueur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Amine Mansouri"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                {/* Email et WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Adresse e-mail <span className="text-[#00ff66]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: joueur@exemple.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Numéro de téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 06 12 34 56 78"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                    />
                  </div>
                </div>

                {/* File Dropzone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#00ff66]" />
                      <span>Justificatif de paiement (Capture ou PDF)</span>
                      <span className="text-[#00ff66]">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">JPG, PNG, PDF · max 10 Mo</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {!proofData ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 group ${
                        isDragging
                          ? 'border-[#00ff66] bg-[#00ff66]/10'
                          : 'border-[#222e44] hover:border-[#00ff66]/60 bg-[#101622]/60 hover:bg-[#101622]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#172030] border border-[#253249] flex items-center justify-center text-slate-400 group-hover:text-[#00ff66] group-hover:border-[#00ff66]/50 transition-colors">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">
                          Cliquez pour sélectionner ou glissez-déposez votre reçu
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Capture d'écran du virement ou document PDF bancaire
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#121927] border border-[#00ff66]/50 flex items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-3 truncate">
                        {proofType.includes('pdf') ? (
                          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#233149] shrink-0 bg-black">
                            <img src={proofData} alt="Aperçu reçu" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="truncate space-y-0.5">
                          <span className="font-bold text-white text-xs block truncate">{proofName}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{proofSize}</span>
                            <span>·</span>
                            <span className="text-[#00ff66] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Fichier prêt à envoyer
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 rounded-xl bg-[#182335] hover:bg-rose-500 hover:text-white text-slate-400 transition-colors cursor-pointer shrink-0"
                        title="Supprimer et remplacer le fichier"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 pt-1.5 font-mono">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fileError}</span>
                    </span>
                  )}
                </div>

                {/* Notes additionnelles */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Remarque / Référence de transaction (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Virement effectué depuis mon compte CIH sous le nom Amine M."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#121824] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !proofData}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#00ff66] text-black font-display font-black text-sm uppercase tracking-wider hover:bg-[#00e65c] transition-all duration-200 shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Envoi du justificatif en cours...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" />
                        <span>Soumettre mon justificatif de paiement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION STATUT : HISTORIQUE DES JUSTIFICATIFS DE L'UTILISATEUR */}
        {/* ============================================================ */}
        {myPayments.length > 0 && (
          <div className="mt-12 p-6 rounded-3xl bg-[#0c111a] border border-[#1b2538] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#182132]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00ff66]" />
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
                  Mes Justificatifs de Paiement ({myPayments.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Suivi de validation par l'administrateur
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPayments.map((p) => {
                const isAccepted = p.status === 'accepted';
                const isRejected = p.status === 'rejected';
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#111723] border border-[#1e2a3d] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase truncate">
                        {p.tournamentName || 'Tournoi FC'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          isAccepted
                            ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30'
                            : isRejected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                        }`}
                      >
                        {isAccepted ? 'Accepté ✓' : isRejected ? 'Refusé ✕' : 'En attente ⏳'}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px] text-slate-400">
                      <div>
                        Moyen : <strong className="text-white">{p.paymentMethodName}</strong>
                      </div>
                      <div>
                        Montant : <strong className="text-[#00ff66]">{p.amountMAD || 49.99} MAD</strong>
                      </div>
                      <div>
                        Reçu : <span className="text-slate-300 truncate">{p.proofName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Déposé le {new Date(p.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>

                    {isRejected && p.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                        <strong>Motif du refus :</strong> {p.rejectionReason}
                      </div>
                    )}

                    {isAccepted && (
                      <div className="p-2.5 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] text-[11px]">
                        Paiement validé par le staff. Votre inscription est confirmée !
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
