#!/usr/bin/env node
/**
 * FC TOURNAMENT - Google AI Studio Registration Management CLI
 * Permet à l'administrateur de consulter, accepter et refuser les inscriptions
 * directement depuis l'environnement Google AI Studio.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbFile = path.resolve(rootDir, 'data', 'fc_database.json');
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const adminCode = process.env.ADMIN_ACCESS_CODE || '96300130';

function loadLocalDatabase() {
  if (!fs.existsSync(dbFile)) {
    console.error(`[ERREUR] Fichier de base de données introuvable : ${dbFile}`);
    process.exit(1);
  }
  const content = fs.readFileSync(dbFile, 'utf-8');
  return JSON.parse(content);
}

function saveLocalDatabase(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
}

// Ensure registrationNumbers exist on all items
function ensureRegistrationNumbers(db) {
  let updated = false;
  if (!Array.isArray(db.registrations)) {
    db.registrations = [];
  }
  db.registrations.forEach((reg, index) => {
    if (!reg.registrationNumber) {
      reg.registrationNumber = `REG-2026-${String(index + 1).padStart(4, '0')}`;
      updated = true;
    }
  });
  if (updated) {
    saveLocalDatabase(db);
  }
}

async function tryServerAction(action, regIdentifier, extraData = {}) {
  try {
    const res = await fetch(`${serverUrl}/api/admin/studio/registrations/${encodeURIComponent(regIdentifier)}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-code': adminCode,
      },
      body: JSON.stringify({ action, ...extraData }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, viaServer: true, data };
    }
  } catch {
    // Server not running or fetch failed, fallback to direct local database manipulation
  }
  return { success: false, viaServer: false };
}

function formatStatus(status) {
  if (status === 'confirmed') return '\x1b[32m✔ VALIDÉ\x1b[0m';
  if (status === 'rejected') return '\x1b[31m✖ REFUSÉ\x1b[0m';
  return '\x1b[33m⏳ EN ATTENTE\x1b[0m';
}

function printHelp() {
  console.log(`
\x1b[1m\x1b[36m===============================================================
     FC TOURNAMENT - GESTIONNAIRE D'INSCRIPTIONS AI STUDIO
===============================================================\x1b[0m

Utilisation :
  \x1b[32mnpm run admin:registrations\x1b[0m                     (Liste toutes les inscriptions)
  \x1b[32mnpm run admin:registrations pending\x1b[0m             (Liste uniquement les inscriptions en attente)
  \x1b[32mnpm run admin:registrations view <NUMÉRO/ID>\x1b[0m    (Affiche les détails complets d'un participant)
  \x1b[32mnpm run admin:registrations accept <NUMÉRO/ID>\x1b[0m  (Accepte et valide l'inscription)
  \x1b[32mnpm run admin:registrations reject <NUMÉRO/ID> [motif]\x1b[0m (Refuse l'inscription avec motif)

Exemples :
  node scripts/manage-registrations.mjs pending
  node scripts/manage-registrations.mjs accept REG-2026-0005
  node scripts/manage-registrations.mjs reject REG-2026-0008 "Reçu de paiement illisible"
`);
}

async function listRegistrations(filter = 'all') {
  const db = loadLocalDatabase();
  ensureRegistrationNumbers(db);

  let regs = db.registrations || [];
  if (filter === 'pending') {
    regs = regs.filter((r) => r.status === 'pending');
  } else if (filter === 'confirmed') {
    regs = regs.filter((r) => r.status === 'confirmed');
  } else if (filter === 'rejected') {
    regs = regs.filter((r) => r.status === 'rejected');
  }

  const total = (db.registrations || []).length;
  const pendingCount = (db.registrations || []).filter((r) => r.status === 'pending').length;
  const confirmedCount = (db.registrations || []).filter((r) => r.status === 'confirmed').length;
  const rejectedCount = (db.registrations || []).filter((r) => r.status === 'rejected').length;

  console.log('\n\x1b[1m\x1b[32m--- STATISTIQUES DES INSCRIPTIONS ---\x1b[0m');
  console.log(`Total : \x1b[1m${total}\x1b[0m | En attente : \x1b[33m\x1b[1m${pendingCount}\x1b[0m | Validées : \x1b[32m\x1b[1m${confirmedCount}\x1b[0m | Refusées : \x1b[31m\x1b[1m${rejectedCount}\x1b[0m\n`);

  if (regs.length === 0) {
    console.log(filter === 'pending' ? '✨ Aucune inscription en attente ! Toutes les demandes ont été traitées.' : 'Aucune inscription trouvée.');
    return;
  }

  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log(`| ${'N° UNIQUE'.padEnd(14)} | ${'GAMERTAG'.padEnd(16)} | ${'NOM DU JOUEUR'.padEnd(20)} | ${'STATUT'.padEnd(18)} | ${'TOURNOI'.padEnd(18)} | ${'DATE'.padEnd(10)} |`);
  console.log('------------------------------------------------------------------------------------------------------------------------');

  regs.forEach((r) => {
    const num = (r.registrationNumber || r.id).padEnd(14);
    const tag = (r.gamertag || 'N/A').slice(0, 16).padEnd(16);
    const name = (r.playerName || 'N/A').slice(0, 20).padEnd(20);
    const stat = formatStatus(r.status);
    const tourn = (r.tournamentName || r.tournamentId || 'FC Tournoi').slice(0, 18).padEnd(18);
    const dateStr = r.registeredAt ? r.registeredAt.slice(0, 10) : 'N/A';
    console.log(`| ${num} | ${tag} | ${name} | ${stat.padEnd(27)} | ${tourn} | ${dateStr} |`);
  });

  console.log('------------------------------------------------------------------------------------------------------------------------\n');
}

async function viewRegistration(identifier) {
  if (!identifier) {
    console.error('Veuillez spécifier le numéro (ex: REG-2026-0001) ou l\'ID de l\'inscription.');
    process.exit(1);
  }

  const db = loadLocalDatabase();
  ensureRegistrationNumbers(db);

  const clean = identifier.trim().toLowerCase();
  const reg = db.registrations.find(
    (r) =>
      r.id.toLowerCase() === clean ||
      (r.registrationNumber && r.registrationNumber.toLowerCase() === clean) ||
      (r.registrationNumber && r.registrationNumber.replace(/^reg-/i, '').toLowerCase() === clean)
  );

  if (!reg) {
    console.error(`\x1b[31m[ERREUR] Inscription « ${identifier} » introuvable.\x1b[0m`);
    process.exit(1);
  }

  const tourn = db.tournaments.find((t) => t.id === reg.tournamentId);

  console.log(`
\x1b[1m\x1b[36m===============================================================
       FICHE DÉTAILLÉE DU PARTICIPANT : ${reg.registrationNumber || reg.id}
===============================================================\x1b[0m
  • Numéro unique      : \x1b[1m${reg.registrationNumber || reg.id}\x1b[0m
  • Identifiant base   : ${reg.id}
  • Statut actuel      : ${formatStatus(reg.status)}
  • Nom & Prénom       : \x1b[1m${reg.playerName}\x1b[0m
  • Gamertag (Pseudo)  : \x1b[32m\x1b[1m${reg.gamertag}\x1b[0m
  • Adresse e-mail     : ${reg.userEmail || 'Non renseigné'}
  • Téléphone          : ${reg.phone || 'Non renseigné'}
  • Tournoi            : ${tourn ? tourn.name : (reg.tournamentName || reg.tournamentId)}
  • Équipe choisie     : ${reg.teamSelected || 'Par défaut'}
  • Manette            : ${reg.controllerPreference || 'Non spécifiée'}
  • Remarques / Notes  : ${reg.notes || 'Aucune'}
  • Date d'inscription : ${reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('fr-FR') : 'N/A'}
  • Date de validation : ${reg.validatedAt ? new Date(reg.validatedAt).toLocaleString('fr-FR') : 'Non validé'}
  • Date de refus      : ${reg.rejectedAt ? new Date(reg.rejectedAt).toLocaleString('fr-FR') : 'N/A'}
  • Motif de refus     : ${reg.rejectionReason || 'Aucun'}
  • Preuve de paiement : ${reg.paymentProof ? `Présente (${reg.paymentProofName || 'capture.png'})` : 'Absente'}
  • Invitation WhatsApp: ${reg.whatsappInviteStatus === 'sent' ? 'Envoyée par email' : 'Non envoyée'}
===============================================================
`);
}

async function acceptRegistration(identifier) {
  if (!identifier) {
    console.error('Veuillez spécifier le numéro (ex: REG-2026-0001) ou l\'ID de l\'inscription à accepter.');
    process.exit(1);
  }

  // First try via running server (triggers WhatsApp email and audit logging)
  const serverResult = await tryServerAction('accept', identifier);
  if (serverResult.success) {
    console.log(`\x1b[32m\x1b[1m✔ Inscription acceptée avec succès via le serveur !\x1b[0m`);
    console.log(`Message : ${serverResult.data.message || 'Statut mis à jour sur « Validé ».'}`);
    return;
  }

  // Fallback to local DB manipulation
  const db = loadLocalDatabase();
  ensureRegistrationNumbers(db);

  const clean = identifier.trim().toLowerCase();
  const reg = db.registrations.find(
    (r) =>
      r.id.toLowerCase() === clean ||
      (r.registrationNumber && r.registrationNumber.toLowerCase() === clean) ||
      (r.registrationNumber && r.registrationNumber.replace(/^reg-/i, '').toLowerCase() === clean)
  );

  if (!reg) {
    console.error(`\x1b[31m[ERREUR] Inscription « ${identifier} » introuvable.\x1b[0m`);
    process.exit(1);
  }

  reg.status = 'confirmed';
  reg.validatedAt = new Date().toISOString();
  reg.reviewedBy = 'Google AI Studio Admin';
  delete reg.rejectedAt;
  delete reg.rejectionReason;

  // Add notification audit
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'system',
    title: `Inscription Validée (${reg.registrationNumber || reg.gamertag})`,
    message: `L'inscription de ${reg.playerName} (${reg.gamertag}) a été officiellement acceptée depuis Google AI Studio le ${new Date().toLocaleString('fr-FR')}.`,
    registrationId: reg.id,
    createdAt: new Date().toISOString(),
    read: false,
  });

  saveLocalDatabase(db);

  console.log(`\n\x1b[32m\x1b[1m✔ SUCCÈS : L'inscription a été acceptée et validée !\x1b[0m`);
  console.log(`• Numéro : ${reg.registrationNumber}`);
  console.log(`• Participant : ${reg.playerName} (${reg.gamertag})`);
  console.log(`• Nouveau statut : \x1b[32mValidé (Confirmé)\x1b[0m`);
  console.log(`• Date de validation : ${new Date(reg.validatedAt).toLocaleString('fr-FR')}`);
  console.log(`• La base de données et le site web ont été synchronisés immédiatement.\n`);
}

async function rejectRegistration(identifier, reason = 'Dossier ou paiement non conforme') {
  if (!identifier) {
    console.error('Veuillez spécifier le numéro (ex: REG-2026-0001) ou l\'ID de l\'inscription à refuser.');
    process.exit(1);
  }

  // First try via running server
  const serverResult = await tryServerAction('reject', identifier, { rejectionReason: reason });
  if (serverResult.success) {
    console.log(`\x1b[31m\x1b[1m✖ Inscription refusée avec succès via le serveur !\x1b[0m`);
    console.log(`Message : ${serverResult.data.message || 'Statut mis à jour sur « Refusé ».'}`);
    return;
  }

  // Fallback to local DB manipulation
  const db = loadLocalDatabase();
  ensureRegistrationNumbers(db);

  const clean = identifier.trim().toLowerCase();
  const reg = db.registrations.find(
    (r) =>
      r.id.toLowerCase() === clean ||
      (r.registrationNumber && r.registrationNumber.toLowerCase() === clean) ||
      (r.registrationNumber && r.registrationNumber.replace(/^reg-/i, '').toLowerCase() === clean)
  );

  if (!reg) {
    console.error(`\x1b[31m[ERREUR] Inscription « ${identifier} » introuvable.\x1b[0m`);
    process.exit(1);
  }

  reg.status = 'rejected';
  reg.rejectedAt = new Date().toISOString();
  reg.rejectionReason = reason;
  reg.reviewedBy = 'Google AI Studio Admin';
  delete reg.validatedAt;

  // Add notification audit
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: 'system',
    title: `Inscription Refusée (${reg.registrationNumber || reg.gamertag})`,
    message: `L'inscription de ${reg.playerName} (${reg.gamertag}) a été refusée depuis Google AI Studio (Motif: ${reason}).`,
    registrationId: reg.id,
    createdAt: new Date().toISOString(),
    read: false,
  });

  saveLocalDatabase(db);

  console.log(`\n\x1b[31m\x1b[1m✖ Inscription refusée avec succès.\x1b[0m`);
  console.log(`• Numéro : ${reg.registrationNumber}`);
  console.log(`• Participant : ${reg.playerName} (${reg.gamertag})`);
  console.log(`• Nouveau statut : \x1b[31mRefusé\x1b[0m`);
  console.log(`• Motif de refus : ${reason}`);
  console.log(`• Date de refus : ${new Date(reg.rejectedAt).toLocaleString('fr-FR')}`);
  console.log(`• La base de données et le site web ont été synchronisés immédiatement.\n`);
}

// Main CLI router
const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'list';

switch (command) {
  case 'list':
  case 'all':
    listRegistrations('all');
    break;
  case 'pending':
  case 'attente':
  case 'nouvelles':
    listRegistrations('pending');
    break;
  case 'confirmed':
  case 'valide':
  case 'valides':
    listRegistrations('confirmed');
    break;
  case 'rejected':
  case 'refuse':
  case 'refuses':
    listRegistrations('rejected');
    break;
  case 'view':
  case 'show':
  case 'details':
    viewRegistration(args[1]);
    break;
  case 'accept':
  case 'valider':
  case 'accepter':
    acceptRegistration(args[1]);
    break;
  case 'reject':
  case 'refuser':
    rejectRegistration(args[1], args.slice(2).join(' ') || undefined);
    break;
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    // If user passed a registration number directly (e.g. REG-2026-0001)
    if (command.startsWith('reg-')) {
      viewRegistration(command);
    } else {
      console.log(`Commande inconnue : « ${command} »`);
      printHelp();
    }
}
