// Securise les comptes de demo (mots de passe admin123 / joueur123) dans Postgres.
// - Le compte admin recoit le nouveau mot de passe que tu choisis.
// - Les comptes joueurs de demo recoivent un mot de passe aleatoire (plus personne ne peut s'y connecter),
//   sans supprimer leurs inscriptions ni leurs matchs.
//
// Usage :
//   node scripts/secure-demo-accounts.mjs                                  (apercu, ne modifie rien)
//   node scripts/secure-demo-accounts.mjs --apply --admin-password=TonMotDePasse
import crypto from 'crypto';
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
const adminArg = process.argv.find((a) => a.startsWith('--admin-password='));
const adminPassword = adminArg ? adminArg.slice('--admin-password='.length) : '';

const DEMO_PASSWORDS = ['admin123', 'joueur123'];
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const usesDemoPassword = (u) =>
  u.salt && u.passwordHash && DEMO_PASSWORDS.some((p) => hashPassword(p, u.salt) === u.passwordHash);

const pool = new pg.Pool({ connectionString: url });

try {
  const { rows } = await pool.query(`SELECT value FROM fc_kv WHERE key = 'db'`);
  if (!rows.length) {
    console.error('Aucune donnee trouvee (table fc_kv vide). Lance d\'abord scripts/seed-db.mjs.');
    process.exit(1);
  }

  const db = rows[0].value;
  const targets = (db.users || []).filter(usesDemoPassword);

  if (!targets.length) {
    console.log('Aucun compte n\'utilise encore admin123 ou joueur123. Rien a faire.');
    process.exit(0);
  }

  console.log('Comptes avec un mot de passe de demo :');
  console.table(targets.map((u) => ({ email: u.email, gamertag: u.gamertag, role: u.role })));

  const hasAdmin = targets.some((u) => u.role === 'admin');
  if (!apply) {
    console.log('\nApercu seulement. Pour appliquer :');
    console.log('node scripts/secure-demo-accounts.mjs --apply --admin-password=TonMotDePasse');
    process.exit(0);
  }

  if (hasAdmin && adminPassword.length < 10) {
    console.error('Le compte admin est concerne : ajoute --admin-password=... (10 caracteres minimum).');
    process.exit(1);
  }

  for (const u of targets) {
    const salt = crypto.randomBytes(16).toString('hex');
    const newPassword = u.role === 'admin' ? adminPassword : crypto.randomBytes(24).toString('hex');
    u.salt = salt;
    u.passwordHash = hashPassword(newPassword, salt);
  }

  await pool.query(
    `UPDATE fc_kv SET value = $1::jsonb, version = version + 1, updated_at = now() WHERE key = 'db'`,
    [JSON.stringify(db)]
  );

  // Deconnecte toutes les sessions ouvertes, y compris celles obtenues avec les anciens mots de passe
  await pool.query(
    `INSERT INTO fc_kv (key, value) VALUES ('sessions', '{}'::jsonb), ('admin_sessions', '{}'::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = '{}'::jsonb, version = fc_kv.version + 1, updated_at = now()`
  );

  console.log(`\nTermine : ${targets.length} compte(s) securise(s), toutes les sessions ont ete fermees.`);
  if (hasAdmin) console.log('Le compte admin utilise maintenant le mot de passe que tu as fourni.');
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
