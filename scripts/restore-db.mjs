// Restaure une sauvegarde faite avec scripts/backup-db.mjs.
// ATTENTION : remplace les donnees en ligne par celles de la sauvegarde.
// Une sauvegarde de l'etat actuel est faite automatiquement juste avant.
//
// Usage :
//   node scripts/restore-db.mjs <fichier>           (apercu, ne modifie rien)
//   node scripts/restore-db.mjs <fichier> --apply   (restauration)
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

const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const apply = process.argv.includes('--apply');
if (!fileArg || !fs.existsSync(fileArg)) {
  console.error('Indique le fichier de sauvegarde, par exemple :');
  console.error('node scripts/restore-db.mjs ..\\fc-tournament-sauvegardes\\sauvegarde-2026-11-20_08h00.json');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(fileArg, 'utf-8'));
if (backup.format !== 'fc-tournament-sauvegarde-v1' || !Array.isArray(backup.kv)) {
  console.error("Ce fichier n'est pas une sauvegarde FC Tournament valide.");
  process.exit(1);
}

// Date et heure locales de l'ordinateur, ex : 2026-11-20_08h00
function localStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
}

const pool = new pg.Pool({ connectionString: url });
const summary = (db) => ({
  Comptes: db?.users?.length ?? 0,
  Inscriptions: db?.registrations?.length ?? 0,
  Matchs: db?.matches?.length ?? 0,
  'Scores envoyes': db?.scoreSubmissions?.length ?? 0,
});

try {
  const current = await pool.query(`SELECT value FROM fc_kv WHERE key = 'db'`);
  const savedDb = backup.kv.find((r) => r.key === 'db')?.value;
  console.log(`Sauvegarde du ${backup.createdAt}${backup.withImages ? '' : ' (sans images)'}`);
  console.table({ 'En ligne actuellement': summary(current.rows[0]?.value), 'Dans la sauvegarde': summary(savedDb) });

  if (!apply) {
    console.log('\nApercu seulement. Pour restaurer : ajoute --apply a la commande.');
    process.exit(0);
  }

  // Filet de securite : copie de l'etat actuel avant de le remplacer
  const backupDir = path.resolve('..', 'fc-tournament-sauvegardes');
  fs.mkdirSync(backupDir, { recursive: true });
  const safety = path.join(backupDir, `avant-restauration-${localStamp()}.json`);
  const kvNow = await pool.query(`SELECT key, value, version, updated_at FROM fc_kv WHERE key NOT IN ('sessions', 'admin_sessions')`);
  fs.writeFileSync(safety, JSON.stringify({ format: 'fc-tournament-sauvegarde-v1', createdAt: new Date().toISOString(), withImages: false, kv: kvNow.rows, proofs: [] }), 'utf-8');
  console.log(`Etat actuel sauvegarde dans ${safety}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Meme verrou que le site : aucune ecriture du site ne peut se glisser pendant la restauration
    await client.query('SELECT pg_advisory_xact_lock(727001)');
    for (const row of backup.kv) {
      await client.query(
        `INSERT INTO fc_kv (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, version = fc_kv.version + 1, updated_at = now()`,
        [row.key, JSON.stringify(row.value)]
      );
    }
    if (backup.proofs?.length) {
      await client.query(`CREATE TABLE IF NOT EXISTS fc_proofs (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      for (const p of backup.proofs) {
        await client.query(`INSERT INTO fc_proofs (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [p.id, p.data]);
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  console.log('Restauration terminee. Le site utilise les donnees restaurees des la prochaine requete.');
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
