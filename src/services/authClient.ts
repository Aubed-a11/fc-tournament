import type { User, UserWithCredentials } from '../types/index.ts';

const USERS_STORAGE_KEY = 'fc_users_db';
const TOKEN_STORAGE_KEY = 'fc_token';
const CURRENT_USER_KEY = 'fc_user';

// Default initial users for demo and fallback
export const DEFAULT_USERS: UserWithCredentials[] = [
  {
    id: 'usr_admin',
    email: 'admin@fctournament.ma',
    passwordHash: 'admin123', // In demo fallback, plain or hashed check
    salt: 'salt_admin_demo',
    gamertag: 'Admin_FC',
    firstName: 'Karim',
    lastName: 'El Mansouri',
    role: 'admin',
    favoriteTeam: 'Real Madrid',
    bio: 'Responsable de l’organisation des tournois eSport.',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'usr_amine',
    email: 'joueur@fctournament.ma',
    passwordHash: 'joueur123',
    salt: 'salt_amine_demo',
    gamertag: 'Amine_FC',
    firstName: 'Amine',
    lastName: 'Bennani',
    role: 'player',
    favoriteTeam: 'Real Madrid',
    bio: 'Finaliste Champions Cup 2025. Joueur offensif tiki-taka.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-15T14:30:00.000Z',
  },
  {
    id: 'usr_reda',
    email: 'reda@fctournament.ma',
    passwordHash: 'joueur123',
    salt: 'salt_reda_demo',
    gamertag: 'Reda_TheKing',
    firstName: 'Reda',
    lastName: 'Berrada',
    role: 'player',
    favoriteTeam: 'Manchester City',
    bio: 'Compétiteur eSport. Spécialiste contre-attaque.',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-16T09:00:00.000Z',
  },
  {
    id: 'usr_yassine',
    email: 'yassine@fctournament.ma',
    passwordHash: 'joueur123',
    salt: 'salt_yassine_demo',
    gamertag: 'Yassine_99',
    firstName: 'Yassine',
    lastName: 'Mansouri',
    role: 'player',
    favoriteTeam: 'FC Barcelone',
    bio: 'Joueur régulier à Al Qods Gaming.',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-18T16:20:00.000Z',
  },
];

// Helper: SHA-256 hashing for client-side fallback
async function hashPasswordClient(password: string, salt: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${password}:${salt}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if crypto.subtle is restricted
  }
  // Basic deterministic fallback
  let hash = 0;
  const str = `${password}:${salt}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function getStoredUsers(): UserWithCredentials[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }
  return [...DEFAULT_USERS];
}

function saveStoredUsers(users: UserWithCredentials[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Quota or access error
  }
}

export interface RegisterPayload {
  email: string;
  password: string;
  gamertag: string;
  firstName?: string;
  lastName?: string;
  favoriteTeam?: string;
  bio?: string;
}

export const authClient = {
  getStoredUsers,
  saveStoredUsers,

  async register(formData: RegisterPayload): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
  }> {
    const email = (formData.email || '').trim().toLowerCase();
    const gamertag = (formData.gamertag || '').trim();
    const password = formData.password || '';

    // 1. Strict client-side validation
    if (!email || !gamertag || !password) {
      return {
        success: false,
        error: 'Champs obligatoires manquants : adresse e-mail, pseudonyme et mot de passe.',
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        error: 'Veuillez saisir une adresse e-mail valide (ex: joueur@domaine.com).',
      };
    }

    if (gamertag.length < 2) {
      return {
        success: false,
        error: 'Le pseudonyme (Gamertag) doit comporter au moins 2 caractères.',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Le mot de passe doit comporter au moins 6 caractères.',
      };
    }

    // 2. Try server route /api/auth/register first
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email,
          gamertag,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.token && data.user) {
          // Success from server: Sync user to local storage
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));

          // Also keep in local user database
          const users = getStoredUsers();
          if (!users.some((u) => u.id === data.user.id || u.email.toLowerCase() === email)) {
            users.push({
              ...data.user,
              passwordHash: 'server_hashed',
              salt: 'server_salt',
            });
            saveStoredUsers(users);
          }

          return { success: true, user: data.user, token: data.token };
        } else if (!res.ok) {
          // Explicit error from server (e.g. duplicate email, duplicate gamertag)
          return {
            success: false,
            error: data.error || 'Erreur lors de la création du compte.',
          };
        }
      } else if (res.status === 400 || res.status === 409 || res.status === 422) {
        // Validation or conflict error without json
        const text = await res.text().catch(() => '');
        return {
          success: false,
          error: text || 'Cette adresse e-mail ou ce pseudonyme est déjà utilisé.',
        };
      }
    } catch {
      // Server offline, CORS error, or deployment without serverless function
    }

    // 3. Resilient Fallback: Register locally in persistent client database
    const localUsers = getStoredUsers();

    // Check duplicate email
    if (localUsers.some((u) => u.email.toLowerCase() === email)) {
      return {
        success: false,
        error: 'Cette adresse e-mail est déjà utilisée par un autre compte.',
      };
    }

    // Check duplicate gamertag (case-insensitive)
    if (localUsers.some((u) => u.gamertag.toLowerCase() === gamertag.toLowerCase())) {
      return {
        success: false,
        error: 'Ce pseudonyme (Gamertag) est déjà réservé par un autre joueur.',
      };
    }

    // Hash password with salt
    const salt = `salt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const passwordHash = await hashPasswordClient(password, salt);

    const newUserWithCred: UserWithCredentials = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      passwordHash,
      salt,
      gamertag,
      firstName: (formData.firstName || '').trim(),
      lastName: (formData.lastName || '').trim(),
      role: 'player',
      favoriteTeam: (formData.favoriteTeam || 'EA FC Club').trim(),
      bio: (formData.bio || '').trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamertag)}`,
      createdAt: new Date().toISOString(),
    };

    localUsers.push(newUserWithCred);
    saveStoredUsers(localUsers);

    const fallbackToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const { passwordHash: _, salt: __, ...userSafe } = newUserWithCred;

    localStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSafe));

    // Forward notification to FormBold in background
    try {
      const fbData = new FormData();
      fbData.append('type', 'Nouveau Compte Joueur');
      fbData.append('Email', email);
      fbData.append('email', email);
      fbData.append('gamertag', gamertag);
      fbData.append('name', `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || gamertag);
      fbData.append('favoriteTeam', formData.favoriteTeam || '');
      fbData.append(
        'message',
        `Nouveau compte joueur créé : ${gamertag} (${email}). Nom : ${formData.firstName || ''} ${formData.lastName || ''}`
      );
      fetch('https://formbold.com/s/oWp4p', {
        method: 'POST',
        body: fbData,
        headers: { Accept: 'application/json' },
      }).catch(() => {});
    } catch {
      // Ignore background notification failure
    }

    return {
      success: true,
      user: userSafe,
      token: fallbackToken,
    };
  },

  async login(
    emailRaw: string,
    passwordRaw: string
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const email = (emailRaw || '').trim().toLowerCase();
    const password = passwordRaw || '';

    if (!email || !password) {
      return {
        success: false,
        error: 'Veuillez saisir votre adresse e-mail et votre mot de passe.',
      };
    }

    // Try server first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.token && data.user) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
          return { success: true, user: data.user, token: data.token };
        } else if (!res.ok) {
          return {
            success: false,
            error: data.error || 'Identifiants invalides (e-mail ou mot de passe incorrect).',
          };
        }
      } else if (res.status === 401 || res.status === 400) {
        return {
          success: false,
          error: 'Identifiants invalides (e-mail ou mot de passe incorrect).',
        };
      }
    } catch {
      // Fallback
    }

    // Resilient local login
    const localUsers = getStoredUsers();
    const userFound = localUsers.find((u) => u.email.toLowerCase() === email);

    if (!userFound) {
      return {
        success: false,
        error: 'Aucun compte trouvé avec cette adresse e-mail. Veuillez vérifier ou créer un compte.',
      };
    }

    // Check password
    let match = false;
    if (userFound.passwordHash === password) {
      // Plaintext demo password check (e.g. 'admin123', 'joueur123')
      match = true;
    } else {
      const hashedAttempt = await hashPasswordClient(password, userFound.salt);
      if (hashedAttempt === userFound.passwordHash) {
        match = true;
      }
    }

    if (!match) {
      return {
        success: false,
        error: 'Mot de passe incorrect. Veuillez réessayer.',
      };
    }

    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const { passwordHash: _, salt: __, ...userSafe } = userFound;

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSafe));

    return {
      success: true,
      user: userSafe,
      token,
    };
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch {
      // Fallback
    }

    // Restore from localStorage
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    return null;
  },

  logout(): void {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};
