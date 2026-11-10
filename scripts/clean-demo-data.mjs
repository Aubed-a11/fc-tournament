// Supprime les donnees de demonstration de la base en ligne (Neon) :
// - tous les matchs (simulations de resultats et de classement) et les scores envoyes lies
// - les comptes joueurs de demo (@fctournament.ma sauf admin@fctournament.ma, et @example.com)
// - leurs inscriptions, justificatifs de paiement, notifications et sessions
// Les vraies inscriptions, les tournois et les comptes admin sont conserves.
//
// Usage :
//   node scripts/clean-demo-data.mjs           (apercu, ne modifie rien)
//   node scripts/clean-demo-data.mjs --apply   (supprime pour de bon, apres sauvegarde)
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url || url.includes('[SENSITIVE]')) {
  console.error('DATABASE_URL introuvable ou invalide dans .env.local.');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const KEEP_EMAILS = new Set(['admin@fctournament.ma']);
const isDemoEmail = (email) => {
  const e = String(email || '').trim().toLowerCase();
  if (KEEP_EMAILS.has(e)) return false;
  return e.endsWith('@fctournament.ma') || e.endsWith('@example.com');
};

const pool = new pg.Pool({ connectionString: url });

try {
  const { rows } = await pool.query(`SELECT value FROM fc_kv WHERE key = 'db'`);
  if (!rows.length) {
    console.error('Aucune donnee trouvee dans la base.');
    process.exit(1);
  }
  const db = rows[0].value;
  const users = db.users || [];
  const demoUsers = users.filter((u) => u.role !== 'admin' && isDemoEmail(u.email));
  const demoIds = new Set(demoUsers.map((u) => u.id));
  const demoTags = new Set(demoUsers.map((u) => String(u.gamertag || '').toLowerCase()));

  const isDemoReg = (r) => demoIds.has(r.userId) || isDemoEmail(r.userEmail);
  const regs = db.registrations || [];
  const demoRegs = regs.filter(isDemoReg);
  const keptRegs = regs.filter((r) => !isDemoReg(r));
  const matches = db.matches || [];
  const scoreSubs = db.scoreSubmissions || [];
  const payments = db.paymentSubmissions || [];
  const demoPayments = payments.filter((p) => demoIds.has(p.userId) || isDemoEmail(p.userEmail));
  const notifs = db.notifications || [];
  const isDemoNotif = (n) =>
    isDemoEmail(n.userEmail) ||
    demoTags.has(String(n.gamertag || '').toLowerCase()) ||
    demoRegs.some((r) => r.id === n.registrationId);
  const demoNotifs = notifs.filter(isDemoNotif);

  console.log('A supprimer :');
  console.table({
    'Matchs (resultats et classement)': matches.length,
    'Scores envoyes par les joueurs': scoreSubs.length,
    'Comptes joueurs de demo': demoUsers.length,
    'Inscriptions de demo': demoRegs.length,
    'Justificatifs de paiement de demo': demoPayments.length,
    'Notifications de demo': demoNotifs.length,
  });
  console.log('\nInscriptions conservees :');
  console.table(keptRegs.map((r) => ({ gamertag: r.gamertag, email: r.userEmail, tournoi: r.tournamentName, statut: r.status })));
  console.log('\nComptes conserves :', users.filter((u) => !demoIds.has(u.id)).map((u) => u.email).join(', '));

  if (!apply) {
    console.log('\nApercu seulement. Pour supprimer : node scripts/clean-demo-data.mjs --apply');
    process.exit(0);
  }

  // Sauvegarde hors du projet, pour qu'elle ne parte jamais sur GitHub (donnees personnelles)
  const backupDir = '../fc-tournament-sauvegardes';
  const backupFile = `${backupDir}/sauvegarde-avant-nettoyage-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\nSauvegarde complete enregistree dans ${backupFile}`);

  db.matches = [];
  db.scoreSubmissions = [];
  db.users = users.filter((u) => !demoIds.has(u.id));
  db.registrations = keptRegs;
  db.paymentSubmissions = payments.filter((p) => !demoPayments.includes(p));
  db.notifications = notifs.filter((n) => !isDemoNotif(n));

  await pool.query(
    `UPDATE fc_kv SET value = $1::jsonb, version = version + 1, updated_at = now() WHERE key = 'db'`,
    [JSON.stringify(db)]
  );

  // Sessions des comptes supprimes
  const s = await pool.query(`SELECT value FROM fc_kv WHERE key = 'sessions'`);
  if (s.rows.length) {
    const sessions = s.rows[0].value || {};
    for (const [token, info] of Object.entries(sessions)) {
      if (demoIds.has(info?.userId)) delete sessions[token];
    }
    await pool.query(
      `UPDATE fc_kv SET value = $1::jsonb, version = version + 1, updated_at = now() WHERE key = 'sessions'`,
      [JSON.stringify(sessions)]
    );
  }

  // Captures d'ecran des scores (table separee)
  const proofIds = scoreSubs.map((x) => x.proofId).filter(Boolean);
  if (proofIds.length) {
    await pool.query(`DELETE FROM fc_proofs WHERE id = ANY($1)`, [proofIds]).catch(() => {});
  }

  console.log('Nettoyage termine. Le classement et les résultats sont maintenant vides.');
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
