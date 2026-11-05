import React, { useState, useRef } from 'react';
import type { Tournament, Registration, User } from '../types/index.ts';
import { formatMAD } from '../utils/format.ts';
import { apiClient } from '../services/apiClient.ts';
import {
  X,
  CheckCircle2,
  Trophy,
  Calendar,
  Gamepad2,
  ShieldAlert,
  Phone,
  User as UserIcon,
  Mail,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  FileCheck2,
  Clock,
  Layers,
} from 'lucide-react';

interface RegistrationModalProps {
  tournament: Tournament;
  user?: User | null;
  token?: string | null;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
  onNavigateToDashboard?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  tournament,
  user,
  token,
  onClose,
  onSuccess,
  onNavigateToDashboard,
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Mandatory player identity fields
  const [playerName, setPlayerName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.gamertag : ''
  );
  const [gamertag, setGamertag] = useState(user ? user.gamertag : '');
  const [userEmail, setUserEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Mandatory Payment Screenshot state
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofName, setPaymentProofName] = useState<string>('');
  const [paymentProofSize, setPaymentProofSize] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRegistration, setCreatedRegistration] = useState<Registration | null>(null);

  const handleFileProcess = (file: File) => {
    setFileError(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setFileError('Format non supporté. Veuillez sélectionner une image au format JPG, JPEG ou PNG.');
      return;
    }

    // Limit to 8MB
    if (file.size > 8 * 1024 * 1024) {
      setFileError("L'image est trop volumineuse (maximum 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentProof(reader.result);
        setPaymentProofName(file.name);
        const formattedSize =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
            : `${Math.round(file.size / 1024)} Ko`;
        setPaymentProofSize(formattedSize);
      }
    };
    reader.onerror = () => {
      setFileError('Erreur lors de la lecture du fichier image.');
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
    setPaymentProof(null);
    setPaymentProofName('');
    setPaymentProofSize('');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFileError(null);

    if (!playerName || playerName.trim().length < 2) {
      setError('Veuillez renseigner votre nom et prénom complets.');
      return;
    }

    if (!gamertag || gamertag.trim().length < 2) {
      setError('Veuillez saisir votre pseudo joueur EA SPORTS FC.');
      return;
    }

    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    if (!phone || phone.trim().length < 6) {
      setError('Veuillez renseigner un numéro de téléphone joignable (WhatsApp/Appels).');
      return;
    }

    if (!paymentProof) {
      setError("La capture d'écran du paiement est obligatoire pour finaliser l'inscription.");
      setFileError("Veuillez importer la capture d'écran de votre preuve de paiement.");
      return;
    }

    if (!rulesAccepted) {
      setError('Veuillez accepter le règlement officiel de la compétition pour finaliser l’inscription.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tournamentName: tournament.name,
        playerName: playerName.trim(),
        gamertag: gamertag.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        paymentProof,
        paymentProofName,
      };

      const result = await apiClient.registerForTournament(tournament.id, payload, token);

      if (!result.success) {
        setError(result.error || 'Erreur lors de l’inscription au tournoi.');
        setLoading(false);
        return;
      }

      if (result.registration) {
        setCreatedRegistration(result.registration);
        onSuccess(result.registration);
      }
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la soumission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#0c1017] border border-[#222c40] rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1b2434] bg-[#111724] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00ff66]/15 border border-[#00ff66]/40 flex items-center justify-center text-[#00ff66]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase leading-tight">
                {step === 'form' ? 'Inscription au Tournoi' : 'Inscription Enregistrée'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {tournament.name} · {tournament.gameVersion}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#192233] transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
            {/* Tournament Quick Summary Card (No Location) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111724] to-[#0c1017] border border-[#1d273a] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#00ff66] uppercase font-bold tracking-wider">
                  Tournoi sélectionné
                </span>
                <span className="text-white font-mono font-bold text-xs">
                  Frais : <span className="text-[#00ff66]">{formatMAD(tournament.entryFeeMAD)}</span>
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-white uppercase">{tournament.name}</h3>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>{tournament.startDate} à {tournament.time}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>{tournament.gameVersion}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>{tournament.platform}</span>
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {user && (
              <div className="p-2.5 rounded-xl bg-[#080b11] border border-[#1a2333] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                  <span className="text-slate-300">
                    Connecté en tant que <strong className="text-white font-mono">{user.gamertag}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-[#00ff66] font-mono">Champs pré-remplis</span>
              </div>
            )}

            {/* Form Fields: Two Columns (Mandatory player info only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Nom et prénom */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium text-[11px]">
                  Nom et Prénom complets <span className="text-[#00ff66]">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Yassine Bennani"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>
              </div>

              {/* 2. Pseudo EA SPORTS FC */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium text-[11px]">
                  Pseudo EA SPORTS FC <span className="text-[#00ff66]">*</span>
                </label>
                <div className="relative">
                  <Gamepad2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amine_FC ou Gamer99"
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>
              </div>

              {/* 3. Numéro de téléphone */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium text-[11px]">
                  Numéro de téléphone / WhatsApp <span className="text-[#00ff66]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 06 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>
              </div>

              {/* 4. Adresse e-mail */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium text-[11px]">
                  Adresse e-mail de contact <span className="text-[#00ff66]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: joueur@exemple.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION OBLIGATOIRE : Capture d'écran du paiement */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>Capture d'écran du paiement</span>
                  <span className="text-[#00ff66]">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Obligatoire (JPG, JPEG, PNG · max 8 Mo)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                className="hidden"
                id="paymentProofInput"
              />

              {!paymentProof ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handleTriggerFileInput}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#00ff66] bg-[#00ff66]/10 scale-[1.01]'
                      : fileError
                      ? 'border-rose-500/50 bg-rose-500/5 hover:border-rose-400'
                      : 'border-[#222f44] bg-[#0d121c] hover:border-[#00ff66]/60 hover:bg-[#101724]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#141b27] border border-[#243147] mx-auto flex items-center justify-center text-[#00ff66] mb-2.5 shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Cliquez pour choisir une capture d'écran ou glissez-la ici
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Reçu bancaire, virement, versement ou ticket de paiement (JPG, PNG)
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141d2c] border border-[#25334a] text-[11px] font-mono text-[#00ff66]">
                    <ImageIcon className="w-3 h-3" />
                    <span>Parcourir les fichiers</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#0f1522] border border-[#00ff66]/40 shadow-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black border border-[#25344d] shrink-0">
                      <img
                        src={paymentProof}
                        alt="Aperçu de la capture"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[#00ff66] font-mono text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Capture chargée avec succès</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {paymentProofName || 'capture_paiement.png'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Taille : {paymentProofSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1b2638]">
                    <button
                      type="button"
                      onClick={handleTriggerFileInput}
                      className="px-3 py-1.5 rounded-lg bg-[#151f2e] hover:bg-[#1d2b3f] text-slate-200 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-[#00ff66]" />
                      <span>Remplacer l'image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              )}

              {fileError && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </p>
              )}
            </div>

            {/* Remarques optionnelles */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium text-[11px]">
                Remarques ou disponibilités particulières (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex : Disponible à partir de 14h, préférence écran 1..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111722] border border-[#202b3d] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>

            {/* Acceptation du règlement */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#111722] border border-[#202b3d] cursor-pointer hover:border-[#2f3d57] transition-colors">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#00ff66] rounded cursor-pointer shrink-0"
              />
              <span className="text-[11px] text-slate-300 leading-relaxed">
                J’atteste avoir pris connaissance du <strong>règlement officiel</strong> du tournoi (matchs compétitifs, élimination directe) et confirme l'exactitude de la preuve de paiement fournie.
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#141b27] transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !rulesAccepted || !paymentProof}
                className="px-6 py-2.5 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {loading ? 'Enregistrement en cours...' : 'Envoyer mon inscription'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation d'enregistrement & statut En attente */
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-400/15 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.25)] animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                Inscription Enregistrée !
              </h3>
              <p className="text-xs text-amber-300 font-semibold">
                En attente de validation du paiement par l'administrateur
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto pt-1 leading-relaxed">
                Vos informations et votre capture de paiement ont été transmises avec succès. Dès validation par l'organisation, vous apparaîtrez officiellement dans la liste publique des participants.
              </p>
            </div>

            {/* Digital Receipt Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#111724] to-[#0a0d15] border border-amber-400/40 text-left space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-400 text-black font-mono font-bold text-[10px] uppercase rounded-bl-xl shadow-md">
                En Attente de Validation
              </div>

              <div className="flex items-center justify-between border-b border-[#1b2538] pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Joueur</span>
                  <span className="font-display text-lg font-black text-white">{createdRegistration?.gamertag || gamertag}</span>
                  <span className="text-xs text-slate-400">{createdRegistration?.playerName || playerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Dossard provisoire</span>
                  <span className="font-mono text-base font-bold text-amber-400">
                    #{createdRegistration?.seed || 1}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tournoi choisi</span>
                  <span className="font-semibold text-slate-200 truncate block">{tournament.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Date & Heure</span>
                  <span className="font-semibold text-white block">
                    {tournament.startDate} à {tournament.time}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Téléphone</span>
                  <span className="font-mono text-slate-300 block">{createdRegistration?.phone || phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">E-mail</span>
                  <span className="font-mono text-slate-300 truncate block">{createdRegistration?.userEmail || userEmail}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Preuve de paiement</span>
                  <span className="font-mono text-[#00ff66] text-[11px] flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reçu transmis ({paymentProofName || 'capture_paiement.png'})</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1b2538] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Statut : <strong className="text-amber-400 uppercase">EN ATTENTE DE VALIDATION</strong></span>
                <span>Frais : {formatMAD(tournament.entryFeeMAD)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-[#101520] p-3 rounded-xl border border-[#1b2333]">
              L'administrateur va vérifier votre capture de paiement sous peu. Vous recevrez une confirmation et votre nom sera affiché dans le tableau officiel.
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#141b27] border border-[#222f44] text-slate-300 text-xs font-semibold hover:text-white hover:bg-[#1a2333] transition-colors cursor-pointer"
              >
                Fermer
              </button>
              {onNavigateToDashboard && user && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDashboard();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#00ff66] text-black font-display text-sm font-bold uppercase tracking-wider hover:bg-[#00e65c] transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)] cursor-pointer flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Mon Espace Joueur</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
