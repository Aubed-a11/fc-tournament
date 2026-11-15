// Sauvegarde complete de la base en ligne (Neon) sur ton ordinateur.
// Contenu : comptes, tournois, inscriptions, matchs, scores, paiements, notifications
// et toutes les captures d'ecran (paiements et scores).
//
// Usage :
//   node scripts/backup-db.mjs                (sauvegarde complete)
//   node scripts/backup-db.mjs --sans-images  (plus legere, sans les captures)
//
// Les fichiers sont ecrits dans C:\Users\HP\fc-tournament-sauvegardes (hors du projet,
// pour ne jamais partir sur GitHub : ils contiennent des donnees personnelles).
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url || url.includes('[SENSITIVE]')) {
  console.error('DATABASE_URL introuvable ou invalide dans .env.local.');
  process.exit(1);
}

const withImages = !process.argv.includes('--sans-images');
const backupDir = path.resolve('..', 'fc-tournament-sauvegardes');
const stamp = localStamp();
const file = path.join(backupDir, `sauvegarde-${stamp}${withImages ? '' : '-sans-images'}.json`);

// Date et heure locales de l'ordinateur, ex : 2026-11-20_08h00
function localStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
}

const pool = new pg.Pool({ connectionString: url });

try {
  // Les sessions de connexion ne sont pas sauvegardees (elles contiennent des jetons d'acces)
  const kv = await pool.query(`SELECT key, value, version, updated_at FROM fc_kv WHERE key NOT IN ('sessions', 'admin_sessions')`);
  if (!kv.rows.length) {
    console.error('La base est vide : rien a sauvegarder.');
    process.exit(1);
  }

  let proofs = [];
  if (withImages) {
    const exists = await pool.query(`SELECT to_regclass('public.fc_proofs') AS t`);
    if (exists.rows[0].t) {
      proofs = (await pool.query(`SELECT id, data, created_at FROM fc_proofs`)).rows;
    }
  }

  const backup = {
    format: 'fc-tournament-sauvegarde-v1',
    createdAt: new Date().toISOString(),
    withImages,
    kv: kv.rows,
    proofs,
  };

  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(backup), 'utf-8');

  const db = kv.rows.find((r) => r.key === 'db')?.value || {};
  const count = (k) => (Array.isArray(db[k]) ? db[k].length : 0);
  console.log('Sauvegarde terminee :');
  console.table({
    Comptes: count('users'),
    Tournois: count('tournaments'),
    Inscriptions: count('registrations'),
    Matchs: count('matches'),
    'Scores envoyes': count('scoreSubmissions'),
    'Justificatifs de paiement': count('paymentSubmissions'),
    'Captures (images)': proofs.length,
  });
  const sizeMo = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
  console.log(`\nFichier : ${file} (${sizeMo} Mo)`);
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
