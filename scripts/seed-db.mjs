// Importe data/fc_database.json dans Postgres (table fc_kv).
// Usage : node scripts/seed-db.mjs          (n'ecrase pas une base existante)
//         node scripts/seed-db.mjs --force  (remplace les donnees en ligne)
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL introuvable. Lance d\'abord : vercel env pull .env.local');
  process.exit(1);
}

const force = process.argv.includes('--force');
const data = JSON.parse(fs.readFileSync('data/fc_database.json', 'utf-8'));
const pool = new pg.Pool({ connectionString: url });

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS fc_kv (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const sql = force
    ? `INSERT INTO fc_kv (key, value) VALUES ('db', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, version = fc_kv.version + 1, updated_at = now()`
    : `INSERT INTO fc_kv (key, value) VALUES ('db', $1::jsonb) ON CONFLICT (key) DO NOTHING`;
  const result = await pool.query(sql, [JSON.stringify(data)]);

  if (result.rowCount) {
    console.log('Donnees importees dans Postgres.');
  } else {
    console.log('Une base existe deja en ligne. Rien n\'a ete ecrase (ajoute --force pour la remplacer).');
  }

  const check = await pool.query(`SELECT
    jsonb_array_length(value->'users') AS users,
    jsonb_array_length(value->'tournaments') AS tournaments,
    jsonb_array_length(value->'registrations') AS registrations,
    jsonb_array_length(value->'matches') AS matches
    FROM fc_kv WHERE key = 'db'`);
  console.table(check.rows);
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
