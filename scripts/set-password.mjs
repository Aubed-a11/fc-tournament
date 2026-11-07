// Change le mot de passe d'un compte dans Postgres et ferme ses sessions.
// Usage : node scripts/set-password.mjs <email> <nouveau_mot_de_passe>
import crypto from 'crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage : node scripts/set-password.mjs <email> <nouveau_mot_de_passe>');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Le mot de passe doit faire au moins 10 caracteres.');
  process.exit(1);
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url || url.includes('[SENSITIVE]')) {
  console.error('DATABASE_URL introuvable ou invalide dans .env.local.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

try {
  const { rows } = await pool.query(`SELECT value FROM fc_kv WHERE key = 'db'`);
  const db = rows[0]?.value;
  const user = db?.users?.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    console.error(`Aucun compte avec l'adresse ${email}.`);
    process.exitCode = 1;
  } else {
    user.salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    await pool.query(
      `UPDATE fc_kv SET value = $1::jsonb, version = version + 1, updated_at = now() WHERE key = 'db'`,
      [JSON.stringify(db)]
    );

    // Ferme les sessions de ce compte
    const s = await pool.query(`SELECT value FROM fc_kv WHERE key = 'sessions'`);
    if (s.rows.length) {
      const sessions = s.rows[0].value || {};
      for (const [token, info] of Object.entries(sessions)) {
        if (info?.userId === user.id) delete sessions[token];
      }
      await pool.query(
        `UPDATE fc_kv SET value = $1::jsonb, version = version + 1, updated_at = now() WHERE key = 'sessions'`,
        [JSON.stringify(sessions)]
      );
    }
    console.log(`Mot de passe mis a jour pour ${user.email} (${user.gamertag}).`);
  }
} catch (err) {
  console.error('Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
