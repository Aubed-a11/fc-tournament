import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawPort = process.env.PORT;
const PORT = rawPort ? isNaN(Number(rawPort)) ? rawPort : Number(rawPort) : 3e3;
const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "fc_data") : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "fc_database.json");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create data directory:", e);
}
const sessions = /* @__PURE__ */ new Map();
const MAX_ADMIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1e3;
const adminSessions = /* @__PURE__ */ new Map();
const adminLoginAttempts = /* @__PURE__ */ new Map();
function verifyAdminCode(inputCode) {
  const secret = process.env.ADMIN_ACCESS_CODE || "FC_ADMIN_2026!";
  const inputBuffer = crypto.createHash("sha256").update(String(inputCode).trim()).digest();
  const secretBuffer = crypto.createHash("sha256").update(String(secret).trim()).digest();
  return crypto.timingSafeEqual(inputBuffer, secretBuffer);
}
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}
function getInitialDatabase() {
  const saltAdmin = generateSalt();
  const saltPlayer1 = generateSalt();
  const saltPlayer2 = generateSalt();
  const saltPlayer3 = generateSalt();
  const saltPlayer4 = generateSalt();
  const saltPlayer5 = generateSalt();
  const saltPlayer6 = generateSalt();
  const saltPlayer7 = generateSalt();
  const saltPlayer8 = generateSalt();
  const users = [
    {
      id: "usr_admin",
      email: "admin@fctournament.ma",
      passwordHash: hashPassword("admin123", saltAdmin),
      salt: saltAdmin,
      gamertag: "Admin_FC",
      firstName: "Karim",
      lastName: "El Mansouri",
      role: "admin",
      favoriteTeam: "Real Madrid",
      bio: "Responsable de l\u2019organisation des tournois eSport.",
      avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-10T10:00:00.000Z"
    },
    {
      id: "usr_amine",
      email: "joueur@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer1),
      salt: saltPlayer1,
      gamertag: "Amine_FC",
      firstName: "Amine",
      lastName: "Bennani",
      role: "player",
      favoriteTeam: "Real Madrid",
      bio: "Finaliste Champions Cup 2025. Joueur offensif tiki-taka.",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-15T14:30:00.000Z"
    },
    {
      id: "usr_reda",
      email: "reda@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer2),
      salt: saltPlayer2,
      gamertag: "Reda_TheKing",
      firstName: "Reda",
      lastName: "Berrada",
      role: "player",
      favoriteTeam: "Manchester City",
      bio: "Comp\xE9titeur eSport. Sp\xE9cialiste contre-attaque.",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-16T09:00:00.000Z"
    },
    {
      id: "usr_yassine",
      email: "yassine@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer3),
      salt: saltPlayer3,
      gamertag: "Yassine_99",
      firstName: "Yassine",
      lastName: "Mansouri",
      role: "player",
      favoriteTeam: "FC Barcelone",
      bio: "Joueur r\xE9gulier \xE0 Al Qods Gaming.",
      avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-18T16:20:00.000Z"
    },
    {
      id: "usr_bilal",
      email: "bilal@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer4),
      salt: saltPlayer4,
      gamertag: "FC_Sniper",
      firstName: "Bilal",
      lastName: "Tahiri",
      role: "player",
      favoriteTeam: "Arsenal",
      bio: "Top 5 Maroc eSport Qualifiers.",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-20T11:15:00.000Z"
    },
    {
      id: "usr_mehdi",
      email: "mehdi@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer5),
      salt: saltPlayer5,
      gamertag: "Mehdi_Pro",
      firstName: "Mehdi",
      lastName: "El Amrani",
      role: "player",
      favoriteTeam: "Paris SG",
      bio: "Passionn\xE9 de gestes techniques et de tirs enroul\xE9s.",
      avatarUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-22T19:40:00.000Z"
    },
    {
      id: "usr_simoo",
      email: "simoo@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer6),
      salt: saltPlayer6,
      gamertag: "Simoo_Dribble",
      firstName: "Mohamed",
      lastName: "Ziani",
      role: "player",
      favoriteTeam: "Bayern Munich",
      bio: "V\xE9t\xE9ran des tournois FIFA / FC.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-25T13:00:00.000Z"
    },
    {
      id: "usr_hamza",
      email: "hamza@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer7),
      salt: saltPlayer7,
      gamertag: "Hamza_FCB",
      firstName: "Hamza",
      lastName: "Chaoui",
      role: "player",
      favoriteTeam: "Liverpool",
      bio: "Pressing haut et jeu rapide.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-27T17:45:00.000Z"
    },
    {
      id: "usr_karim",
      email: "karim.atlas@fctournament.ma",
      passwordHash: hashPassword("joueur123", saltPlayer8),
      salt: saltPlayer8,
      gamertag: "Karim_Atlas",
      firstName: "Karim",
      lastName: "Benali",
      role: "player",
      favoriteTeam: "Maroc eSport",
      bio: "Fier comp\xE9titeur eSport.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-29T20:10:00.000Z"
    }
  ];
  const tournaments = [
    {
      id: "tourn_spring_2026",
      name: "Championnat",
      slug: "championnat-fc-2026",
      description: "Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour c\xE9l\xE9brer la comp\xE9tition et couronner le meilleur joueur dans une ambiance \xE9lectrique devant vos \xE9crans.",
      gameVersion: "EA SPORTS 27",
      platform: "e-Football",
      format: "aller_retour",
      location: "Gaming Arena",
      city: "Maroc",
      startDate: "2027-04-25",
      time: "14:00",
      registrationDeadline: "2027-04-23T23:59:00.000Z",
      maxParticipants: 32,
      entryFeeMAD: 50,
      prizePool: "**** MAD + Troph\xE9e + T-shirt",
      status: "ongoing",
      rules: "Article 1 \u2013 Format des matchs : Les rencontres se disputent en mode \xAB Coup d\u2019envoi \xBB, avec une dur\xE9e de 5 minutes par mi-temps.\nArticle 2 \u2013 Syst\xE8me de confrontation : Chaque comp\xE9titeur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 \u2013 Fair-play et comportement : Le fair-play est obligatoire durant toute la comp\xE9tition. Tout comportement antisportif peut entra\xEEner la disqualification imm\xE9diate.\nArticle 4 \u2013 Utilisation des manettes : Manettes fournies ou manette personnelle autoris\xE9e apr\xE8s v\xE9rification technique.\nArticle 5 \u2013 Transmission des r\xE9sultats : Capture d\u2019\xE9cran du score final obligatoire apr\xE8s chaque match.\nArticle 6 \u2013 Fraude et falsification : Toute falsification entra\xEEne l\u2019\xE9limination imm\xE9diate.\nArticle 7 \u2013 V\xE9rification technique : L\u2019\xE9quipe technique v\xE9rifie l\u2019authenticit\xE9 des captures.\nArticle 8 \u2013 Retard et absence : Retard sup\xE9rieur \xE0 10 minutes = forfait automatique.",
      bannerImage: "/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png",
      createdAt: "2026-02-01T10:00:00.000Z"
    },
    {
      id: "tourn_ligue_oriental_2026",
      name: "Ligue des champions",
      slug: "ligue-des-champions",
      description: "La comp\xE9tition d\u2019\xE9lite qui r\xE9unit les meilleurs joueurs pour s\u2019affronter et d\xE9crocher le titre de champion.",
      gameVersion: "EA SPORTS 27",
      platform: "e-Football",
      format: "aller_retour",
      location: "Gaming Arena",
      city: "Maroc",
      startDate: "2026-03-14",
      time: "16:00",
      registrationDeadline: "2026-03-12T18:00:00.000Z",
      maxParticipants: 32,
      entryFeeMAD: 50,
      prizePool: "**** MAD + Troph\xE9e + T-shirt",
      status: "ongoing",
      rules: "Article 1 \u2013 Format des matchs : Les rencontres se disputent en mode \xAB Coup d\u2019envoi \xBB, avec une dur\xE9e de 5 minutes par mi-temps.\nArticle 2 \u2013 Syst\xE8me de confrontation : Chaque comp\xE9titeur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 \u2013 Fair-play et comportement : Le fair-play est obligatoire durant toute la comp\xE9tition. Tout comportement antisportif peut entra\xEEner la disqualification imm\xE9diate.\nArticle 4 \u2013 Utilisation des manettes : Manettes fournies ou manette personnelle autoris\xE9e apr\xE8s v\xE9rification technique.\nArticle 5 \u2013 Transmission des r\xE9sultats : Capture d\u2019\xE9cran du score final obligatoire apr\xE8s chaque match.\nArticle 6 \u2013 Fraude et falsification : Toute falsification entra\xEEne l\u2019\xE9limination imm\xE9diate.\nArticle 7 \u2013 V\xE9rification technique : L\u2019\xE9quipe technique v\xE9rifie l\u2019authenticit\xE9 des captures.\nArticle 8 \u2013 Retard et absence : Retard sup\xE9rieur \xE0 10 minutes = forfait automatique.",
      bannerImage: "/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png",
      createdAt: "2026-01-20T12:00:00.000Z"
    }
  ];
  const registrations = [
    // Registrations for Spring 2026
    {
      id: "reg_1",
      tournamentId: "tourn_spring_2026",
      userId: "usr_amine",
      gamertag: "Amine_FC",
      playerName: "Amine Bennani",
      userEmail: "joueur@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-02T10:15:00.000Z",
      seed: 1
    },
    {
      id: "reg_2",
      tournamentId: "tourn_spring_2026",
      userId: "usr_reda",
      gamertag: "Reda_TheKing",
      playerName: "Reda Berrada",
      userEmail: "reda@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-02T11:30:00.000Z",
      seed: 2
    },
    {
      id: "reg_3",
      tournamentId: "tourn_spring_2026",
      userId: "usr_yassine",
      gamertag: "Yassine_99",
      playerName: "Yassine Mansouri",
      userEmail: "yassine@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-03T14:20:00.000Z",
      seed: 3
    },
    {
      id: "reg_4",
      tournamentId: "tourn_spring_2026",
      userId: "usr_bilal",
      gamertag: "FC_Sniper",
      playerName: "Bilal Tahiri",
      userEmail: "bilal@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-04T09:45:00.000Z",
      seed: 4
    },
    {
      id: "reg_5",
      tournamentId: "tourn_spring_2026",
      userId: "usr_mehdi",
      gamertag: "Mehdi_Pro",
      playerName: "Mehdi El Amrani",
      userEmail: "mehdi@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-05T16:00:00.000Z",
      seed: 5
    },
    {
      id: "reg_6",
      tournamentId: "tourn_spring_2026",
      userId: "usr_simoo",
      gamertag: "Simoo_Dribble",
      playerName: "Mohamed Ziani",
      userEmail: "simoo@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-06T18:10:00.000Z",
      seed: 6
    },
    {
      id: "reg_7",
      tournamentId: "tourn_spring_2026",
      userId: "usr_hamza",
      gamertag: "Hamza_FCB",
      playerName: "Hamza Chaoui",
      userEmail: "hamza@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-07T14:30:00.000Z",
      seed: 7
    },
    {
      id: "reg_8",
      tournamentId: "tourn_spring_2026",
      userId: "usr_karim",
      gamertag: "Karim_Atlas",
      playerName: "Karim Benali",
      userEmail: "karim.atlas@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-08T11:15:00.000Z",
      seed: 8
    },
    {
      id: "reg_9",
      tournamentId: "tourn_spring_2026",
      userId: "usr_omar",
      gamertag: "Omar_Maestro",
      playerName: "Omar El Alami",
      userEmail: "omar.elalami@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-09T12:00:00.000Z",
      seed: 9
    },
    {
      id: "reg_10",
      tournamentId: "tourn_spring_2026",
      userId: "usr_tariq",
      gamertag: "Tariq_Pro9",
      playerName: "Tariq Mansour",
      userEmail: "tariq.mansour@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-09T16:20:00.000Z",
      seed: 10
    },
    {
      id: "reg_11",
      tournamentId: "tourn_spring_2026",
      userId: "usr_soufiane",
      gamertag: "Souf_Skiller",
      playerName: "Soufiane El Fassi",
      userEmail: "soufiane.elfassi@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-10T18:45:00.000Z",
      seed: 11
    },
    {
      id: "reg_12",
      tournamentId: "tourn_spring_2026",
      userId: "usr_ayoub",
      gamertag: "Ayoub_Striker",
      playerName: "Ayoub Bennis",
      userEmail: "ayoub.bennis@fctournament.ma",
      status: "confirmed",
      registeredAt: "2026-02-11T19:10:00.000Z",
      seed: 12
    },
    // Registrations for Ongoing Ligue de l'Oriental
    {
      id: "reg_oriental_1",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_amine",
      gamertag: "Amine_FC",
      playerName: "Amine Bennani",
      status: "confirmed",
      registeredAt: "2026-02-01T10:00:00.000Z",
      seed: 1
    },
    {
      id: "reg_oriental_2",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_reda",
      gamertag: "Reda_TheKing",
      playerName: "Reda Berrada",
      status: "confirmed",
      registeredAt: "2026-02-01T10:15:00.000Z",
      seed: 2
    },
    {
      id: "reg_oriental_3",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_yassine",
      gamertag: "Yassine_99",
      playerName: "Yassine Mansouri",
      status: "confirmed",
      registeredAt: "2026-02-01T10:30:00.000Z",
      seed: 3
    },
    {
      id: "reg_oriental_4",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_bilal",
      gamertag: "FC_Sniper",
      playerName: "Bilal Tahiri",
      status: "confirmed",
      registeredAt: "2026-02-01T10:45:00.000Z",
      seed: 4
    },
    {
      id: "reg_oriental_5",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_mehdi",
      gamertag: "Mehdi_Pro",
      playerName: "Mehdi El Amrani",
      status: "confirmed",
      registeredAt: "2026-02-01T11:00:00.000Z",
      seed: 5
    },
    {
      id: "reg_oriental_6",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_simoo",
      gamertag: "Simoo_Dribble",
      playerName: "Mohamed Ziani",
      status: "confirmed",
      registeredAt: "2026-02-01T11:15:00.000Z",
      seed: 6
    },
    {
      id: "reg_oriental_7",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_hamza",
      gamertag: "Hamza_FCB",
      playerName: "Hamza Chaoui",
      status: "confirmed",
      registeredAt: "2026-02-01T11:30:00.000Z",
      seed: 7
    },
    {
      id: "reg_oriental_8",
      tournamentId: "tourn_ligue_oriental_2026",
      userId: "usr_karim",
      gamertag: "Karim_Atlas",
      playerName: "Karim Benali",
      status: "confirmed",
      registeredAt: "2026-02-01T11:45:00.000Z",
      seed: 8
    }
  ];
  const matches = [
    // Matches for ongoing Ligue de l'Oriental
    // Quarts de finale (completed)
    {
      id: "match_oriental_qf1",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 1",
      round: 1,
      matchNumber: 1,
      nextMatchId: "match_oriental_sf1",
      nextMatchSlot: 1,
      player1Id: "usr_amine",
      player1Gamertag: "Amine_FC",
      player1Score: 3,
      player2Id: "usr_karim",
      player2Gamertag: "Karim_Atlas",
      player2Score: 1,
      status: "completed",
      winnerId: "usr_amine",
      scheduledDate: "2026-03-14",
      scheduledTime: "16:00",
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: "2026-03-14T16:25:00.000Z",
          adminName: "Admin_FC",
          action: "VALIDATION_SCORE",
          note: "Score officiel v\xE9rifi\xE9 et valid\xE9 sur la console 1."
        }
      ]
    },
    {
      id: "match_oriental_qf2",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 2",
      round: 1,
      matchNumber: 2,
      nextMatchId: "match_oriental_sf1",
      nextMatchSlot: 2,
      player1Id: "usr_bilal",
      player1Gamertag: "FC_Sniper",
      player1Score: 2,
      player2Id: "usr_mehdi",
      player2Gamertag: "Mehdi_Pro",
      player2Score: 0,
      status: "completed",
      winnerId: "usr_bilal",
      scheduledDate: "2026-03-14",
      scheduledTime: "16:30",
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: "2026-03-14T16:55:00.000Z",
          adminName: "Admin_FC",
          action: "VALIDATION_SCORE",
          note: "Score 2-0 valid\xE9. FC_Sniper qualifi\xE9 en demi."
        }
      ]
    },
    {
      id: "match_oriental_qf3",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 3",
      round: 1,
      matchNumber: 3,
      nextMatchId: "match_oriental_sf2",
      nextMatchSlot: 1,
      player1Id: "usr_reda",
      player1Gamertag: "Reda_TheKing",
      player1Score: 4,
      player2Id: "usr_hamza",
      player2Gamertag: "Hamza_FCB",
      player2Score: 2,
      status: "completed",
      winnerId: "usr_reda",
      scheduledDate: "2026-03-14",
      scheduledTime: "17:00",
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: "2026-03-14T17:28:00.000Z",
          adminName: "Admin_FC",
          action: "VALIDATION_SCORE",
          note: "Score 4-2 valid\xE9. Reda_TheKing qualifi\xE9."
        }
      ]
    },
    {
      id: "match_oriental_qf4",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 4",
      round: 1,
      matchNumber: 4,
      nextMatchId: "match_oriental_sf2",
      nextMatchSlot: 2,
      player1Id: "usr_yassine",
      player1Gamertag: "Yassine_99",
      player1Score: 3,
      player2Id: "usr_simoo",
      player2Gamertag: "Simoo_Dribble",
      player2Score: 2,
      status: "completed",
      winnerId: "usr_yassine",
      scheduledDate: "2026-03-14",
      scheduledTime: "17:30",
      validatedByAdmin: true,
      auditLog: [
        {
          timestamp: "2026-03-14T17:58:00.000Z",
          adminName: "Admin_FC",
          action: "VALIDATION_SCORE",
          note: "Score 3-2 en prolongation. Yassine_99 qualifi\xE9."
        }
      ]
    },
    // Demi-finales
    {
      id: "match_oriental_sf1",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "semi_final",
      stageName: "Demi-Finale 1",
      round: 2,
      matchNumber: 1,
      nextMatchId: "match_oriental_final",
      nextMatchSlot: 1,
      player1Id: "usr_amine",
      player1Gamertag: "Amine_FC",
      player1Score: null,
      player2Id: "usr_bilal",
      player2Gamertag: "FC_Sniper",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2026-03-14",
      scheduledTime: "18:30",
      validatedByAdmin: false,
      auditLog: []
    },
    {
      id: "match_oriental_sf2",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "semi_final",
      stageName: "Demi-Finale 2",
      round: 2,
      matchNumber: 2,
      nextMatchId: "match_oriental_final",
      nextMatchSlot: 2,
      player1Id: "usr_reda",
      player1Gamertag: "Reda_TheKing",
      player1Score: null,
      player2Id: "usr_yassine",
      player2Gamertag: "Yassine_99",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2026-03-14",
      scheduledTime: "19:00",
      validatedByAdmin: false,
      auditLog: []
    },
    // Grande Finale
    {
      id: "match_oriental_final",
      tournamentId: "tourn_ligue_oriental_2026",
      stage: "final",
      stageName: "Grande Finale",
      round: 3,
      matchNumber: 1,
      nextMatchId: null,
      player1Id: null,
      player1Gamertag: "Vainqueur Demi 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Demi 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2026-03-14",
      scheduledTime: "20:00",
      validatedByAdmin: false,
      auditLog: []
    },
    // Matches for Championnat (Tirage au sort officiel)
    {
      id: "match_tourn_spring_2026_qf1",
      tournamentId: "tourn_spring_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 1",
      round: 1,
      matchNumber: 1,
      nextMatchId: "match_tourn_spring_2026_sf1",
      nextMatchSlot: 1,
      player1Id: "usr_hamza",
      player1Gamertag: "Hamza_FCB",
      player1Score: null,
      player2Id: "usr_omar",
      player2Gamertag: "Omar_Maestro",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "14:00",
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: "2026-11-03T17:32:00.000Z",
          adminName: "Admin_FC",
          action: "BRACKET_GENERATION",
          note: "Tirage au sort officiel - Quart de Finale 1."
        }
      ]
    },
    {
      id: "match_tourn_spring_2026_qf2",
      tournamentId: "tourn_spring_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 2",
      round: 1,
      matchNumber: 2,
      nextMatchId: "match_tourn_spring_2026_sf1",
      nextMatchSlot: 2,
      player1Id: "usr_soufiane",
      player1Gamertag: "Souf_Skiller",
      player1Score: null,
      player2Id: "usr_tariq",
      player2Gamertag: "Tariq_Pro9",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "14:00",
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: "2026-11-03T17:32:00.000Z",
          adminName: "Admin_FC",
          action: "BRACKET_GENERATION",
          note: "Tirage au sort officiel - Quart de Finale 2."
        }
      ]
    },
    {
      id: "match_tourn_spring_2026_qf3",
      tournamentId: "tourn_spring_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 3",
      round: 1,
      matchNumber: 3,
      nextMatchId: "match_tourn_spring_2026_sf2",
      nextMatchSlot: 1,
      player1Id: "usr_ayoub",
      player1Gamertag: "Ayoub_Striker",
      player1Score: null,
      player2Id: "usr_amine",
      player2Gamertag: "Amine_FC",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "14:00",
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: "2026-11-03T17:32:00.000Z",
          adminName: "Admin_FC",
          action: "BRACKET_GENERATION",
          note: "Tirage au sort officiel - Quart de Finale 3."
        }
      ]
    },
    {
      id: "match_tourn_spring_2026_qf4",
      tournamentId: "tourn_spring_2026",
      stage: "quarter_final",
      stageName: "Quart de Finale 4",
      round: 1,
      matchNumber: 4,
      nextMatchId: "match_tourn_spring_2026_sf2",
      nextMatchSlot: 2,
      player1Id: "usr_reda",
      player1Gamertag: "Reda_TheKing",
      player1Score: null,
      player2Id: "usr_mehdi",
      player2Gamertag: "Mehdi_Pro",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "14:00",
      validatedByAdmin: false,
      auditLog: [
        {
          timestamp: "2026-11-03T17:32:00.000Z",
          adminName: "Admin_FC",
          action: "BRACKET_GENERATION",
          note: "Tirage au sort officiel - Quart de Finale 4."
        }
      ]
    },
    {
      id: "match_tourn_spring_2026_sf1",
      tournamentId: "tourn_spring_2026",
      stage: "semi_final",
      stageName: "Demi-Finale 1",
      round: 2,
      matchNumber: 1,
      nextMatchId: "match_tourn_spring_2026_final",
      nextMatchSlot: 1,
      player1Id: null,
      player1Gamertag: "Vainqueur Quart 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Quart 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "17:30",
      validatedByAdmin: false,
      auditLog: []
    },
    {
      id: "match_tourn_spring_2026_sf2",
      tournamentId: "tourn_spring_2026",
      stage: "semi_final",
      stageName: "Demi-Finale 2",
      round: 2,
      matchNumber: 2,
      nextMatchId: "match_tourn_spring_2026_final",
      nextMatchSlot: 2,
      player1Id: null,
      player1Gamertag: "Vainqueur Quart 3",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Quart 4",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "18:15",
      validatedByAdmin: false,
      auditLog: []
    },
    {
      id: "match_tourn_spring_2026_final",
      tournamentId: "tourn_spring_2026",
      stage: "final",
      stageName: "Grande Finale",
      round: 3,
      matchNumber: 1,
      nextMatchId: null,
      player1Id: null,
      player1Gamertag: "Vainqueur Demi 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Demi 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: "2027-04-25",
      scheduledTime: "19:30",
      validatedByAdmin: false,
      auditLog: []
    }
  ];
  const contacts = [
    {
      id: "contact_1",
      name: "Youssef El Fassi",
      email: "youssef@example.com",
      subject: "Partenariat Salle Gaming",
      message: "Bonjour, nous souhaitons accueillir une \xE9tape de qualification dans notre centre eSport.",
      createdAt: "2026-02-10T11:20:00.000Z",
      replied: false
    }
  ];
  const notifications = [
    {
      id: "notif_welcome",
      type: "new_registration",
      title: "Syst\xE8me d'Inscriptions Activ\xE9",
      message: "Le syst\xE8me d'inscription officiel est op\xE9rationnel. Toutes les nouvelles inscriptions appara\xEEtront ici.",
      playerName: "Amine Bennani",
      gamertag: "Amine_FC",
      userEmail: "joueur@fctournament.ma",
      phone: "+212 6 12 34 56 78",
      tournamentId: "tourn_champions_cup_2026",
      tournamentName: "EA FC 25 Champions Cup",
      registrationId: "reg_champ_1",
      createdAt: "2026-02-05T14:35:00.000Z",
      read: true
    }
  ];
  return { users, tournaments, registrations, matches, contacts, notifications };
}
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed.notifications)) {
        parsed.notifications = [];
      }
      return parsed;
    }
    const bundledPath = path.join(__dirname, "data", "fc_database.json");
    if (bundledPath !== DB_FILE && fs.existsSync(bundledPath)) {
      const data = fs.readFileSync(bundledPath, "utf-8");
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed.notifications)) {
        parsed.notifications = [];
      }
      saveDatabase(parsed);
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, re-initializing:", err);
  }
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}
function saveDatabase(db2) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db2, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}
let db = loadDatabase();
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/CQVBqfeokIqDxa8PgdjleY?s=cl&p=i&mlu=4&ilr=4&iam=2";
async function sendWhatsAppInviteEmail(recipientEmail, playerName, gamertag, tournamentName) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || !emailRegex.test(recipientEmail.trim())) {
    return {
      success: false,
      error: "Adresse e-mail invalide ou non renseign\xE9e."
    };
  }
  const cleanEmail = recipientEmail.trim();
  const subject = "FC TOURNAMENT \u2013 Inscription accept\xE9e !";
  const plainTextMessage = `F\xE9licitations !

Nous avons le plaisir de vous informer que votre inscription au tournoi FC TOURNAMENT a \xE9t\xE9 accept\xE9e.

Pour recevoir les informations, suivre les annonces et \xE9changer avec les autres participants, rejoignez notre groupe WhatsApp officiel en cliquant sur le lien ci-dessous :

REJOINDRE LE GROUPE WHATSAPP :
${WHATSAPP_GROUP_LINK}

Nous vous souhaitons bonne chance et une excellente comp\xE9tition !

L'\xE9quipe FC TOURNAMENT.`;
  const htmlMessage = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#07090e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07090e;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background-color:#0c1017;border:1px solid #1c273a;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.7);" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #0e1522 0%, #121c2e 100%);padding:30px;text-align:center;border-bottom:1px solid #1e2a3f;">
              <div style="display:inline-block;background:#00ff66;color:#07090e;font-weight:900;font-size:12px;letter-spacing:1px;padding:5px 12px;border-radius:6px;margin-bottom:12px;text-transform:uppercase;">
                FC TOURNAMENT
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
                Inscription Accept\xE9e !
              </h1>
              ${tournamentName ? `<p style="margin:8px 0 0 0;color:#94a3b8;font-size:13px;">${tournamentName}</p>` : ""}
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:32px 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              <p style="margin-top:0;font-size:17px;font-weight:700;color:#ffffff;">
                F\xE9licitations ${gamertag ? `<strong>${gamertag}</strong> (${playerName})` : playerName} !
              </p>

              <p style="margin:16px 0;color:#e2e8f0;">
                Nous avons le plaisir de vous informer que votre inscription au tournoi <strong>FC TOURNAMENT</strong> a \xE9t\xE9 accept\xE9e.
              </p>

              <p style="margin:16px 0;color:#94a3b8;">
                Pour recevoir les informations, suivre les annonces et \xE9changer avec les autres participants, rejoignez notre groupe WhatsApp officiel en cliquant sur le lien ci-dessous :
              </p>

              <!-- WhatsApp CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="display:inline-block;background-color:#00ff66;color:#07090e;font-weight:800;font-size:14px;letter-spacing:0.5px;padding:16px 32px;border-radius:12px;text-decoration:none;box-shadow:0 0 25px rgba(0,255,102,0.4);text-transform:uppercase;">
                  REJOINDRE LE GROUPE WHATSAPP &rarr;
                </a>
              </div>

              <!-- Raw Link Container -->
              <div style="background-color:#111724;border:1px solid #1e283b;border-radius:10px;padding:14px;word-break:break-all;font-size:12px;color:#94a3b8;margin-top:20px;">
                <span style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:6px;">Lien direct :</span>
                <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="color:#00ff66;text-decoration:underline;">
                  ${WHATSAPP_GROUP_LINK}
                </a>
              </div>

              <p style="margin:28px 0 0 0;color:#cbd5e1;">
                Nous vous souhaitons bonne chance et une excellente comp\xE9tition !
              </p>

              <p style="margin:16px 0 0 0;color:#ffffff;font-weight:700;">
                L'\xE9quipe FC TOURNAMENT.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#090d14;padding:18px 28px;text-align:center;border-top:1px solid #172030;font-size:11px;color:#64748b;">
              Cet e-mail automatique a \xE9t\xE9 \xE9mis lors de la validation officielle de votre inscription sur FC TOURNAMENT.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"FC TOURNAMENT" <alio227ng@gmail.com>',
        to: cleanEmail,
        subject,
        text: plainTextMessage,
        html: htmlMessage
      });
      console.log(`[SMTP] Invitation WhatsApp envoy\xE9e avec succ\xE8s \xE0 ${cleanEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } else {
      const simulatedMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[EMAIL DISPATCH] Invitation WhatsApp envoy\xE9e \xE0 ${cleanEmail} pour ${gamertag}`);
      console.log(`[EMAIL LINK] ${WHATSAPP_GROUP_LINK}`);
      console.log(`[EMAIL ID] ${simulatedMessageId}`);
      return {
        success: true,
        messageId: simulatedMessageId
      };
    }
  } catch (err) {
    console.error(`[EMAIL ERROR] Erreur lors de l'envoi de l'invitation WhatsApp \xE0 ${cleanEmail}:`, err);
    return {
      success: false,
      error: err?.message || "Erreur lors de l\u2019envoi du courriel transactionnel."
    };
  }
}
const ADMIN_NOTIFICATION_EMAIL = "alio227ng@gmail.com";
const FORMBOLD_ENDPOINT = "https://formbold.com/s/oWp4p";
async function notifyAdminAndFormBold(event) {
  const eventLabel = event.type === "user_account" ? "CR\xC9ATION DE COMPTE JOUEUR" : event.type === "tournament_registration" ? "NOUVELLE INSCRIPTION AU TOURNOI" : "NOUVEAU MESSAGE DE CONTACT";
  try {
    const formParams = new URLSearchParams();
    formParams.append("Email", event.senderEmail || ADMIN_NOTIFICATION_EMAIL);
    formParams.append("email", event.senderEmail || ADMIN_NOTIFICATION_EMAIL);
    formParams.append("name", `${event.senderName} (${event.gamertag || "Joueur"})`);
    formParams.append("gamertag", event.gamertag || "N/A");
    formParams.append("phone", event.phone || "N/A");
    formParams.append("tournament", event.tournamentName || "Plateforme FC TOURNAMENT");
    formParams.append("subject", `[FC TOURNAMENT] ${eventLabel} : ${event.gamertag || event.senderName}`);
    formParams.append(
      "message",
      `[FC TOURNAMENT] ${eventLabel}
------------------------------------
Nom complet : ${event.senderName}
Gamertag (Pseudo) : ${event.gamertag || "N/A"}
Adresse e-mail : ${event.senderEmail}
Num\xE9ro de t\xE9l\xE9phone : ${event.phone || "Non renseign\xE9"}
Tournoi concern\xE9 : ${event.tournamentName || "Plateforme globale"}

D\xE9tails compl\xE9mentaires :
${event.details}

Horodatage : ${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}
Tableau de bord administrateur : https://fc-tournament.com/#admin`
    );
    const fbRes = await fetch(FORMBOLD_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: formParams.toString()
    });
    console.log(`[FORMBOLD RELAY] Alerte transmise avec succ\xE8s \xE0 FormBold (${FORMBOLD_ENDPOINT}) pour ${event.senderEmail} [status: ${fbRes.status}]`);
  } catch (fbErr) {
    console.warn("[FORMBOLD RELAY] Erreur lors de la transmission FormBold:", fbErr);
  }
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"FC TOURNAMENT" <${ADMIN_NOTIFICATION_EMAIL}>`,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `[FC TOURNAMENT] ${eventLabel} : ${event.gamertag || event.senderName}`,
        text: `Bonjour,

Une nouvelle inscription a \xE9t\xE9 effectu\xE9e sur FC TOURNAMENT :

- \xC9v\xE9nement : ${eventLabel}
- Nom complet : ${event.senderName}
- Gamertag (Pseudo) : ${event.gamertag || "N/A"}
- Email : ${event.senderEmail}
- T\xE9l\xE9phone : ${event.phone || "N/A"}
- Tournoi : ${event.tournamentName || "N/A"}

D\xE9tails :
${event.details}

Connectez-vous \xE0 l'espace administrateur pour valider ou g\xE9rer cette entr\xE9e :
https://fc-tournament.com/#admin

L'\xE9quipe FC TOURNAMENT`
      });
      console.log(`[ADMIN SMTP] Notification d'inscription envoy\xE9e par email \xE0 ${ADMIN_NOTIFICATION_EMAIL}`);
    } else {
      console.log(`[ADMIN ALERT] Inscription enregistr\xE9e pour ${ADMIN_NOTIFICATION_EMAIL}: ${event.title}`);
    }
  } catch (smtpErr) {
    console.warn("[ADMIN SMTP] Erreur envoi email direct admin:", smtpErr);
  }
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return next();
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const session = sessions.get(token);
  if (!session) {
    return next();
  }
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return next();
  }
  const userWithCred = db.users.find((u) => u.id === session.userId);
  if (userWithCred) {
    const { passwordHash: _, salt: __, ...userSafe } = userWithCred;
    req.user = userSafe;
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Connexion requise pour effectuer cette action." });
    return;
  }
  next();
}
function requireAdmin(req, res, next) {
  const adminToken = req.headers["x-admin-token"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  if (adminToken && adminSessions.has(adminToken)) {
    const session = adminSessions.get(adminToken);
    if (Date.now() < session.expiresAt) {
      return next();
    } else {
      adminSessions.delete(adminToken);
      res.status(401).json({ error: "Session administrateur expir\xE9e. Veuillez vous reconnecter avec le code d\u2019acc\xE8s." });
      return;
    }
  }
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Acc\xE8s strictement priv\xE9 et r\xE9serv\xE9 aux administrateurs autoris\xE9s." });
}
function computeLeaderboard() {
  const statsMap = /* @__PURE__ */ new Map();
  for (const u of db.users) {
    if (u.role === "player") {
      statsMap.set(u.id, {
        userId: u.id,
        gamertag: u.gamertag,
        playerName: `${u.firstName} ${u.lastName}`.trim(),
        avatarUrl: u.avatarUrl,
        tournamentsPlayed: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        points: 0,
        rank: 0,
        trophies: 0
      });
    }
  }
  const userTournaments = /* @__PURE__ */ new Map();
  for (const reg of db.registrations) {
    if (reg.status === "confirmed") {
      if (!userTournaments.has(reg.userId)) {
        userTournaments.set(reg.userId, /* @__PURE__ */ new Set());
      }
      userTournaments.get(reg.userId).add(reg.tournamentId);
    }
  }
  for (const [userId, tournSet] of userTournaments.entries()) {
    const stat = statsMap.get(userId);
    if (stat) {
      stat.tournamentsPlayed = tournSet.size;
    }
  }
  for (const m of db.matches) {
    if (m.status === "completed" && m.validatedByAdmin) {
      if (m.player1Id && statsMap.has(m.player1Id)) {
        const s1 = statsMap.get(m.player1Id);
        s1.matchesPlayed += 1;
        if (m.winnerId === m.player1Id) {
          s1.wins += 1;
          s1.points += 3;
        } else if (m.winnerId) {
          s1.losses += 1;
        } else {
          s1.points += 1;
        }
      }
      if (m.player2Id && statsMap.has(m.player2Id)) {
        const s2 = statsMap.get(m.player2Id);
        s2.matchesPlayed += 1;
        if (m.winnerId === m.player2Id) {
          s2.wins += 1;
          s2.points += 3;
        } else if (m.winnerId) {
          s2.losses += 1;
        } else {
          s2.points += 1;
        }
      }
      if (m.stage === "final" && m.winnerId && statsMap.has(m.winnerId)) {
        const champ = statsMap.get(m.winnerId);
        champ.trophies += 1;
      }
    }
  }
  const list = Array.from(statsMap.values()).map((p) => {
    const rate = p.matchesPlayed > 0 ? Math.round(p.wins / p.matchesPlayed * 100) : 0;
    return {
      ...p,
      winRate: rate
    };
  });
  list.sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.wins - a.wins);
  list.forEach((item, index) => {
    item.rank = index + 1;
  });
  return list;
}
const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(authenticateToken);
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(express.static(path.join(__dirname, "public")));
const handleRegister = (req, res) => {
  try {
    const { email, password, gamertag, firstName, lastName, favoriteTeam, bio } = req.body || {};
    if (!email || !password || !gamertag) {
      res.status(400).json({ error: "Champs obligatoires manquants : e-mail, pseudonyme et mot de passe." });
      return;
    }
    const emailTrimmed = String(email).trim().toLowerCase();
    const gamertagTrimmed = String(gamertag).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      res.status(400).json({ error: "Format d'adresse e-mail invalide (ex: joueur@domaine.com)." });
      return;
    }
    if (gamertagTrimmed.length < 2) {
      res.status(400).json({ error: "Le pseudonyme (Gamertag) doit comporter au moins 2 caract\xE8res." });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: "Le mot de passe doit comporter au moins 6 caract\xE8res." });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === emailTrimmed)) {
      res.status(409).json({ error: "Cette adresse e-mail est d\xE9j\xE0 utilis\xE9e par un autre compte." });
      return;
    }
    if (db.users.some((u) => u.gamertag.toLowerCase() === gamertagTrimmed.toLowerCase())) {
      res.status(409).json({ error: "Ce pseudonyme (Gamertag) est d\xE9j\xE0 r\xE9serv\xE9 par un autre joueur." });
      return;
    }
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: emailTrimmed,
      passwordHash,
      salt,
      gamertag: gamertagTrimmed,
      firstName: (firstName || "").trim(),
      lastName: (lastName || "").trim(),
      role: "player",
      favoriteTeam: (favoriteTeam || "EA FC Club").trim(),
      bio: (bio || "").trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamertagTrimmed)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newUser);
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "new_registration",
      title: "Nouveau compte joueur cr\xE9\xE9",
      message: `Le joueur ${gamertagTrimmed} (${(newUser.firstName || "") + " " + (newUser.lastName || "")}) vient de s'inscrire avec l'e-mail ${emailTrimmed}.`,
      playerName: `${newUser.firstName || ""} ${newUser.lastName || ""}`.trim() || gamertagTrimmed,
      gamertag: gamertagTrimmed,
      userEmail: emailTrimmed,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    });
    try {
      saveDatabase(db);
    } catch (saveErr) {
      console.error("Erreur lors de la sauvegarde du joueur:", saveErr);
      res.status(500).json({ error: "Erreur lors de l\u2019enregistrement dans la base de donn\xE9es." });
      return;
    }
    notifyAdminAndFormBold({
      type: "user_account",
      title: `Nouveau compte joueur inscrit : ${gamertagTrimmed}`,
      senderEmail: emailTrimmed,
      senderName: `${newUser.firstName || ""} ${newUser.lastName || ""}`.trim() || gamertagTrimmed,
      gamertag: gamertagTrimmed,
      details: `Cr\xE9ation de profil comp\xE9titeur r\xE9ussie. \xC9quipe s\xE9lectionn\xE9e: ${newUser.favoriteTeam}.`
    }).catch((err) => console.warn("Erreur notifyAdminAndFormBold sur user_account:", err));
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
      userId: newUser.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1e3
      // 30 days
    });
    const { passwordHash: _, salt: __, ...userSafe } = newUser;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error("Erreur inattendue lors de l\u2019inscription:", err);
    res.status(500).json({ error: "Erreur interne du serveur lors de la cr\xE9ation du compte." });
  }
};
app.post("/api/auth/register", handleRegister);
app.post("/auth/register", handleRegister);
const handleLogin = (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "Veuillez saisir votre adresse e-mail et votre mot de passe." });
      return;
    }
    const userWithCred = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!userWithCred) {
      res.status(401).json({ error: "Identifiants invalides (aucun compte avec cette adresse e-mail)." });
      return;
    }
    const computedHash = hashPassword(password, userWithCred.salt);
    if (computedHash !== userWithCred.passwordHash) {
      res.status(401).json({ error: "Identifiants invalides (mot de passe incorrect)." });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
      userId: userWithCred.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1e3
    });
    const { passwordHash: _, salt: __, ...userSafe } = userWithCred;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error("Erreur inattendue lors de la connexion:", err);
    res.status(500).json({ error: "Erreur interne du serveur lors de la connexion." });
  }
};
app.post("/api/auth/login", handleLogin);
app.post("/auth/login", handleLogin);
const handleMe = (req, res) => {
  if (!req.user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: req.user });
};
app.get("/api/auth/me", handleMe);
app.get("/auth/me", handleMe);
app.put("/api/auth/profile", requireAuth, (req, res) => {
  const { gamertag, firstName, lastName, favoriteTeam, bio, avatarUrl } = req.body;
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    res.status(404).json({ error: "Utilisateur introuvable." });
    return;
  }
  if (gamertag && gamertag.trim() !== db.users[userIndex].gamertag) {
    const exists = db.users.some(
      (u) => u.id !== req.user.id && u.gamertag.toLowerCase() === gamertag.trim().toLowerCase()
    );
    if (exists) {
      res.status(400).json({ error: "Ce pseudonyme est d\xE9j\xE0 utilis\xE9 par un autre joueur." });
      return;
    }
    db.users[userIndex].gamertag = gamertag.trim();
  }
  if (firstName !== void 0) db.users[userIndex].firstName = firstName.trim();
  if (lastName !== void 0) db.users[userIndex].lastName = lastName.trim();
  if (favoriteTeam !== void 0) db.users[userIndex].favoriteTeam = favoriteTeam.trim();
  if (bio !== void 0) db.users[userIndex].bio = bio.trim();
  if (avatarUrl !== void 0) db.users[userIndex].avatarUrl = avatarUrl.trim();
  saveDatabase(db);
  const { passwordHash: _, salt: __, ...userSafe } = db.users[userIndex];
  req.user = userSafe;
  res.json({ user: userSafe, message: "Profil mis \xE0 jour avec succ\xE8s." });
});
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    sessions.delete(token);
  }
  res.json({ success: true });
});
app.get("/api/tournaments", (req, res) => {
  const currentUserId = req.user?.id;
  const tournamentsWithStats = db.tournaments.map((t) => {
    const tournRegs = db.registrations.filter((r) => r.tournamentId === t.id);
    const confirmedCount = tournRegs.filter((r) => r.status === "confirmed").length;
    const userReg = currentUserId ? tournRegs.find((r) => r.userId === currentUserId) : null;
    return {
      ...t,
      participantsCount: confirmedCount,
      confirmedCount,
      userRegistration: userReg || null
    };
  });
  res.json(tournamentsWithStats);
});
app.get("/api/tournaments/:id", (req, res) => {
  const tournament = db.tournaments.find((t) => t.id === req.params.id || t.slug === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  const currentUserId = req.user?.id;
  const tournRegs = db.registrations.filter((r) => r.tournamentId === tournament.id);
  const confirmedCount = tournRegs.filter((r) => r.status === "confirmed").length;
  const userReg = currentUserId ? tournRegs.find((r) => r.userId === currentUserId) : null;
  const tournamentMatches = db.matches.filter((m) => m.tournamentId === tournament.id);
  const isAdmin = req.user?.role === "admin";
  const sanitizedRegistrations = isAdmin ? tournRegs : [];
  res.json({
    ...tournament,
    participantsCount: confirmedCount,
    confirmedCount,
    userRegistration: userReg || null,
    registrations: sanitizedRegistrations,
    matches: tournamentMatches
  });
});
app.post("/api/tournaments/:id/register", (req, res) => {
  const tournament = db.tournaments.find((t) => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  if (tournament.status === "completed") {
    res.status(400).json({ error: "Inscription impossible : ce tournoi est d\xE9j\xE0 termin\xE9 et archiv\xE9." });
    return;
  }
  if (tournament.status === "ongoing") {
    res.status(400).json({ error: "Inscription ferm\xE9e : la comp\xE9tition est actuellement en cours de d\xE9roulement." });
    return;
  }
  if (tournament.status !== "open") {
    res.status(400).json({ error: "Les inscriptions \xE0 cette comp\xE9tition ne sont pas ouvertes." });
    return;
  }
  if (tournament.registrationDeadline) {
    const deadlineTime = new Date(tournament.registrationDeadline).getTime();
    if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
      res.status(400).json({ error: "La date limite officielle des inscriptions pour ce tournoi est d\xE9pass\xE9e." });
      return;
    }
  }
  const confirmedCount = db.registrations.filter(
    (r) => r.tournamentId === tournament.id && r.status === "confirmed"
  ).length;
  if (confirmedCount >= tournament.maxParticipants) {
    res.status(400).json({ error: "Ce tournoi a atteint sa capacit\xE9 maximale de participants." });
    return;
  }
  const {
    playerName,
    phone,
    gamertag,
    userEmail,
    teamSelected,
    controllerPreference,
    notes,
    paymentProof,
    paymentProofName
  } = req.body || {};
  const cleanPlayerName = (playerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : "")).trim();
  const cleanGamertag = (gamertag || req.user?.gamertag || "").trim();
  const cleanEmail = (userEmail || req.user?.email || "").trim().toLowerCase();
  const cleanPhone = (phone || "").trim();
  if (!cleanPlayerName || cleanPlayerName.length < 2) {
    res.status(400).json({ error: "Veuillez saisir votre nom et pr\xE9nom complets." });
    return;
  }
  if (!cleanGamertag || cleanGamertag.length < 2) {
    res.status(400).json({ error: "Veuillez renseigner votre pseudo EA SPORTS FC." });
    return;
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: "Veuillez saisir une adresse e-mail valide." });
    return;
  }
  if (!cleanPhone || cleanPhone.length < 6) {
    res.status(400).json({ error: "Veuillez renseigner un num\xE9ro de t\xE9l\xE9phone valide." });
    return;
  }
  if (!paymentProof || typeof paymentProof !== "string" || !paymentProof.startsWith("data:image/")) {
    res.status(400).json({
      error: "La capture d'\xE9cran du paiement (JPG, JPEG ou PNG) est obligatoire pour finaliser votre inscription."
    });
    return;
  }
  const matchFormat = paymentProof.match(/^data:image\/(jpeg|jpg|png);base64,/i);
  if (!matchFormat) {
    res.status(400).json({
      error: "Format de la capture non support\xE9. Veuillez joindre une image au format JPG, JPEG ou PNG."
    });
    return;
  }
  const existing = db.registrations.find(
    (r) => r.tournamentId === tournament.id && (req.user && r.userId === req.user.id || r.gamertag.toLowerCase() === cleanGamertag.toLowerCase() || r.userEmail && r.userEmail.toLowerCase() === cleanEmail)
  );
  if (existing) {
    res.status(400).json({ error: "Ce pseudo ou cette adresse e-mail est d\xE9j\xE0 inscrit(e) \xE0 ce tournoi." });
    return;
  }
  const newRegistration = {
    id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    userId: req.user ? req.user.id : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gamertag: cleanGamertag,
    playerName: cleanPlayerName,
    userEmail: cleanEmail,
    phone: cleanPhone,
    teamSelected: teamSelected ? String(teamSelected).trim() : req.user?.favoriteTeam || "Real Madrid",
    controllerPreference: controllerPreference ? String(controllerPreference).trim() : "Manette personnelle PS5",
    notes: notes ? String(notes).trim() : void 0,
    paymentProof,
    paymentProofName: paymentProofName ? String(paymentProofName).trim().slice(0, 100) : "recu_paiement.png",
    status: "pending",
    registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
    seed: confirmedCount + 1
  };
  db.registrations.push(newRegistration);
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "new_registration",
    title: "Nouvelle Inscription Tournoi (En attente de validation)",
    message: `${cleanPlayerName} (${cleanGamertag}) vient de d\xE9poser son inscription avec capture de paiement pour le tournoi \xAB ${tournament.name} \xBB.`,
    playerName: cleanPlayerName,
    gamertag: cleanGamertag,
    userEmail: cleanEmail,
    phone: cleanPhone,
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    registrationId: newRegistration.id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  };
  db.notifications.unshift(newNotif);
  saveDatabase(db);
  notifyAdminAndFormBold({
    type: "tournament_registration",
    title: `Nouvelle inscription au tournoi \xAB ${tournament.name} \xBB : ${cleanGamertag}`,
    senderEmail: cleanEmail,
    senderName: cleanPlayerName,
    gamertag: cleanGamertag,
    phone: cleanPhone,
    tournamentName: tournament.name,
    details: `Le joueur ${cleanPlayerName} (${cleanGamertag}) a d\xE9pos\xE9 son inscription avec capture de preuve de paiement (${paymentProofName || "capture.png"}). Statut actuel: En attente de validation.`
  }).catch((err) => console.warn("Erreur notifyAdminAndFormBold sur tournament_registration:", err));
  res.json({
    registration: newRegistration,
    message: "Inscription et preuve de paiement enregistr\xE9es avec succ\xE8s ! Votre inscription est en attente de v\xE9rification par l\u2019administrateur."
  });
});
app.delete("/api/tournaments/:id/register", requireAuth, (req, res) => {
  const tournament = db.tournaments.find((t) => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  if (tournament.status === "completed" || tournament.status === "ongoing") {
    res.status(400).json({ error: "Impossible d\u2019annuler une inscription \xE0 un tournoi en cours ou termin\xE9." });
    return;
  }
  const regIndex = db.registrations.findIndex(
    (r) => r.tournamentId === tournament.id && r.userId === req.user.id
  );
  if (regIndex === -1) {
    res.status(404).json({ error: "Aucune inscription trouv\xE9e pour ce tournoi." });
    return;
  }
  db.registrations.splice(regIndex, 1);
  saveDatabase(db);
  res.json({ message: "Votre inscription a bien \xE9t\xE9 annul\xE9e." });
});
app.get("/api/matches", (req, res) => {
  const { tournamentId, status } = req.query;
  let list = [...db.matches];
  if (tournamentId) {
    list = list.filter((m) => m.tournamentId === tournamentId);
  }
  if (status) {
    list = list.filter((m) => m.status === status);
  }
  list.sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (b.status === "live" && a.status !== "live") return 1;
    return (/* @__PURE__ */ new Date(b.scheduledDate + " " + b.scheduledTime)).getTime() - (/* @__PURE__ */ new Date(a.scheduledDate + " " + a.scheduledTime)).getTime();
  });
  res.json(list);
});
app.get("/api/leaderboard", (_req, res) => {
  const rankings = computeLeaderboard();
  res.json(rankings);
});
app.get("/api/player/dashboard", requireAuth, (req, res) => {
  const userId = req.user.id;
  const userRegs = db.registrations.filter((r) => r.userId === userId);
  const tournamentIds = userRegs.map((r) => r.tournamentId);
  const userTournaments = db.tournaments.filter((t) => tournamentIds.includes(t.id));
  const userMatches = db.matches.filter(
    (m) => m.player1Id === userId || m.player2Id === userId
  );
  const leaderboard = computeLeaderboard();
  const rankInfo = leaderboard.find((l) => l.userId === userId) || {
    userId,
    gamertag: req.user.gamertag,
    playerName: `${req.user.firstName} ${req.user.lastName}`.trim(),
    tournamentsPlayed: userTournaments.length,
    matchesPlayed: userMatches.length,
    wins: userMatches.filter((m) => m.winnerId === userId).length,
    losses: userMatches.filter((m) => m.status === "completed" && m.winnerId && m.winnerId !== userId).length,
    winRate: 0,
    points: 0,
    rank: leaderboard.length + 1,
    trophies: 0
  };
  res.json({
    user: req.user,
    stats: rankInfo,
    registrations: userRegs,
    tournaments: userTournaments,
    matches: userMatches
  });
});
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires (nom, e-mail, message)." });
    return;
  }
  const newContact = {
    id: `cnt_${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    subject: (subject || "Message FC Tournament").trim(),
    message: message.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    replied: false
  };
  db.contacts.push(newContact);
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: "contact_message",
    title: `Message re\xE7u : ${newContact.subject}`,
    message: `${newContact.name} (${newContact.email}) : "${newContact.message.slice(0, 100)}${newContact.message.length > 100 ? "..." : ""}"`,
    playerName: newContact.name,
    userEmail: newContact.email,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  });
  saveDatabase(db);
  notifyAdminAndFormBold({
    type: "contact_message",
    title: `Message de contact : ${newContact.subject}`,
    senderEmail: newContact.email,
    senderName: newContact.name,
    details: newContact.message
  }).catch((err) => console.warn("Erreur notifyAdminAndFormBold sur contact:", err));
  res.json({ success: true, message: "Merci ! Votre message a bien \xE9t\xE9 envoy\xE9 au staff de FC Tournament." });
});
app.post("/api/admin/auth/login-code", (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
    const realIp = req.headers["x-real-ip"]?.trim();
    const clientIp = forwarded || realIp || req.ip || req.socket?.remoteAddress || "unknown_client";
    const now = Date.now();
    let rateData = adminLoginAttempts.get(clientIp);
    if (!rateData) {
      rateData = { attempts: 0, lastAttempt: now, lockedUntil: null };
      adminLoginAttempts.set(clientIp, rateData);
    }
    if (rateData.lockedUntil && now < rateData.lockedUntil) {
      const remainingMs = rateData.lockedUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1e3));
      res.status(429).json({
        error: `Trop de tentatives infructueuses. Acc\xE8s administrateur temporairement verrouill\xE9. Veuillez patienter ${remainingMinutes} minute(s).`,
        lockedUntil: rateData.lockedUntil,
        remainingSeconds: Math.ceil(remainingMs / 1e3),
        remainingAttempts: 0
      });
      return;
    }
    if (rateData.lockedUntil && now >= rateData.lockedUntil) {
      rateData.attempts = 0;
      rateData.lockedUntil = null;
    }
    const { accessCode } = req.body || {};
    if (!accessCode || typeof accessCode !== "string") {
      res.status(400).json({ error: "Code d\u2019acc\xE8s administrateur obligatoire." });
      return;
    }
    const isValid = verifyAdminCode(accessCode);
    if (!isValid) {
      rateData.attempts += 1;
      rateData.lastAttempt = now;
      if (rateData.attempts >= MAX_ADMIN_ATTEMPTS) {
        rateData.lockedUntil = now + LOCKOUT_DURATION_MS;
        res.status(429).json({
          error: "S\xE9curit\xE9 : 5 tentatives infructueuses cons\xE9cutives. L\u2019acc\xE8s administrateur est verrouill\xE9 pendant 15 minutes.",
          lockedUntil: rateData.lockedUntil,
          remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1e3),
          remainingAttempts: 0
        });
        return;
      }
      const remaining = MAX_ADMIN_ATTEMPTS - rateData.attempts;
      res.status(401).json({
        error: `Code d\u2019acc\xE8s incorrect. Il vous reste ${remaining} tentative(s) avant verrouillage temporaire.`,
        remainingAttempts: remaining
      });
      return;
    }
    rateData.attempts = 0;
    rateData.lockedUntil = null;
    const adminToken = `adm_sec_${crypto.randomBytes(48).toString("hex")}`;
    const expiresAt = now + ADMIN_SESSION_TTL_MS;
    adminSessions.set(adminToken, {
      token: adminToken,
      createdAt: now,
      expiresAt,
      clientIp
    });
    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "system",
      title: "Connexion administrateur s\xE9curis\xE9e",
      message: `Acc\xE8s administrateur authentifi\xE9 avec succ\xE8s par code secret le ${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR")}.`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    });
    saveDatabase(db);
    res.json({
      success: true,
      adminToken,
      expiresAt,
      message: "Acc\xE8s administrateur valid\xE9 avec succ\xE8s."
    });
  } catch (err) {
    console.error("Erreur authentification code admin:", err);
    res.status(500).json({ error: "Erreur interne du serveur lors de la v\xE9rification de s\xE9curit\xE9." });
  }
});
app.get("/api/admin/auth/verify", (req, res) => {
  const adminToken = req.headers["x-admin-token"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  if (!adminToken) {
    res.status(401).json({ valid: false, error: "Token administrateur manquant." });
    return;
  }
  const session = adminSessions.get(adminToken);
  if (!session || Date.now() >= session.expiresAt) {
    if (session) adminSessions.delete(adminToken);
    res.status(401).json({ valid: false, error: "Session administrateur expir\xE9e ou inexistante." });
    return;
  }
  res.json({
    valid: true,
    expiresAt: session.expiresAt,
    remainingMinutes: Math.round((session.expiresAt - Date.now()) / (60 * 1e3))
  });
});
app.post("/api/admin/auth/logout", (req, res) => {
  const adminToken = req.headers["x-admin-token"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  if (adminToken && adminSessions.has(adminToken)) {
    adminSessions.delete(adminToken);
  }
  res.json({ success: true, message: "Session administrateur r\xE9voqu\xE9e avec succ\xE8s." });
});
app.post("/api/admin/tournaments", requireAdmin, (req, res) => {
  const {
    name,
    description,
    gameVersion,
    platform,
    format,
    location,
    startDate,
    time,
    registrationDeadline,
    maxParticipants,
    entryFeeMAD,
    prizePool,
    rules,
    bannerImage
  } = req.body;
  if (!name || !startDate || !time) {
    res.status(400).json({ error: "Le nom, la date et l\u2019heure du tournoi sont obligatoires." });
    return;
  }
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const newTournament = {
    id: `tourn_${Date.now()}`,
    name: name.trim(),
    slug: `${slug}-${Date.now().toString(36)}`,
    description: (description || "Tournoi de football virtuel eSport").trim(),
    gameVersion: (gameVersion || "EA SPORTS FC 25").trim(),
    platform: (platform || "e-Football").trim(),
    format: format || "single_elimination",
    location: (location || "Gaming Arena").trim(),
    city: "Maroc",
    startDate,
    time,
    registrationDeadline: registrationDeadline || `${startDate}T${time}:00.000Z`,
    maxParticipants: parseInt(maxParticipants, 10) || 32,
    entryFeeMAD: parseFloat(entryFeeMAD) || 0,
    prizePool: (prizePool || "Troph\xE9e + M\xE9dailles").trim(),
    status: "open",
    rules: (rules || "R\xE8glement officiel EA FC Tournament").trim(),
    bannerImage: bannerImage || "/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.tournaments.push(newTournament);
  saveDatabase(db);
  res.json({ tournament: newTournament, message: "Tournoi cr\xE9\xE9 avec succ\xE8s !" });
});
app.put("/api/admin/tournaments/:id", requireAdmin, (req, res) => {
  const tIndex = db.tournaments.findIndex((t) => t.id === req.params.id);
  if (tIndex === -1) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  const body = req.body;
  db.tournaments[tIndex] = {
    ...db.tournaments[tIndex],
    ...body,
    id: db.tournaments[tIndex].id
    // preserve id
  };
  saveDatabase(db);
  res.json({ tournament: db.tournaments[tIndex], message: "Tournoi mis \xE0 jour." });
});
app.delete("/api/admin/tournaments/:id", requireAdmin, (req, res) => {
  const tIndex = db.tournaments.findIndex((t) => t.id === req.params.id);
  if (tIndex === -1) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  db.tournaments.splice(tIndex, 1);
  db.registrations = db.registrations.filter((r) => r.tournamentId !== req.params.id);
  db.matches = db.matches.filter((m) => m.tournamentId !== req.params.id);
  saveDatabase(db);
  res.json({ message: "Tournoi et donn\xE9es associ\xE9es supprim\xE9s avec succ\xE8s." });
});
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const { search } = req.query;
  let usersList = db.users.map((u) => {
    const { passwordHash: _, salt: __, ...userSafe } = u;
    const tournamentRegs = db.registrations.filter(
      (r) => r.userId === u.id || r.userEmail && r.userEmail.toLowerCase() === u.email.toLowerCase()
    );
    return {
      ...userSafe,
      tournamentRegistrationsCount: tournamentRegs.length,
      tournamentRegistrations: tournamentRegs.map((r) => ({
        id: r.id,
        tournamentId: r.tournamentId,
        tournamentName: r.tournamentName,
        status: r.status,
        registeredAt: r.registeredAt
      }))
    };
  });
  if (search && typeof search === "string" && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    usersList = usersList.filter(
      (u) => u.gamertag.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.firstName && u.firstName.toLowerCase().includes(q) || u.lastName && u.lastName.toLowerCase().includes(q)
    );
  }
  usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({
    users: usersList,
    totalCount: usersList.length,
    playersCount: usersList.filter((u) => u.role === "player").length
  });
});
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const targetId = req.params.id;
  const targetUser = db.users.find((u) => u.id === targetId);
  if (!targetUser) {
    res.status(404).json({ error: "Compte joueur introuvable." });
    return;
  }
  if (targetUser.role === "admin" || targetUser.email === "admin@fctournament.ma") {
    res.status(403).json({ error: "Action interdite : impossible de supprimer un compte administrateur." });
    return;
  }
  db.users = db.users.filter((u) => u.id !== targetId);
  saveDatabase(db);
  res.json({ success: true, message: `Compte du joueur ${targetUser.gamertag} supprim\xE9 avec succ\xE8s.` });
});
app.get("/api/admin/registrations", requireAdmin, (req, res) => {
  const { tournamentId, status, search } = req.query;
  const tournamentsMap = new Map(db.tournaments.map((t) => [t.id, t]));
  let list = db.registrations.map((r) => {
    const tourn = tournamentsMap.get(r.tournamentId);
    return {
      ...r,
      tournamentName: r.tournamentName || tourn?.name || "Tournoi FC",
      tournamentStartDate: tourn?.startDate,
      tournamentTime: tourn?.time
    };
  });
  if (tournamentId && tournamentId !== "all") {
    list = list.filter((r) => r.tournamentId === tournamentId);
  }
  if (status && status !== "all") {
    list = list.filter((r) => r.status === status);
  }
  if (search && typeof search === "string" && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (r) => r.playerName.toLowerCase().includes(q) || r.gamertag.toLowerCase().includes(q) || r.userEmail && r.userEmail.toLowerCase().includes(q) || r.phone && r.phone.toLowerCase().includes(q) || r.tournamentName && r.tournamentName.toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  const tournamentsStats = db.tournaments.map((t) => {
    const tRegs = db.registrations.filter((r) => r.tournamentId === t.id);
    return {
      id: t.id,
      name: t.name,
      total: tRegs.length,
      confirmed: tRegs.filter((r) => r.status === "confirmed").length,
      pending: tRegs.filter((r) => r.status === "pending").length,
      rejected: tRegs.filter((r) => r.status === "rejected").length,
      maxParticipants: t.maxParticipants,
      status: t.status
    };
  });
  res.json({
    registrations: list,
    totalCount: db.registrations.length,
    confirmedCount: db.registrations.filter((r) => r.status === "confirmed").length,
    pendingCount: db.registrations.filter((r) => r.status === "pending").length,
    rejectedCount: db.registrations.filter((r) => r.status === "rejected").length,
    tournamentsStats
  });
});
app.get("/api/admin/registrations/export", requireAdmin, (req, res) => {
  const { tournamentId } = req.query;
  const tournamentsMap = new Map(db.tournaments.map((t) => [t.id, t.name]));
  let list = [...db.registrations];
  if (tournamentId && tournamentId !== "all") {
    list = list.filter((r) => r.tournamentId === tournamentId);
  }
  list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  const escapeCsv = (str) => {
    if (str === void 0 || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };
  const header = [
    "Dossard",
    "Nom et Pr\xE9nom",
    "Pseudo EA FC",
    "Num\xE9ro de T\xE9l\xE9phone",
    "Adresse E-mail",
    "Tournoi Choisi",
    "\xC9quipe S\xE9lectionn\xE9e",
    "Pr\xE9f\xE9rence Manette",
    "Date et Heure d'Inscription",
    "Statut",
    "Notes et Remarques"
  ];
  const rows = list.map((r) => [
    escapeCsv(r.seed || "-"),
    escapeCsv(r.playerName),
    escapeCsv(r.gamertag),
    escapeCsv(r.phone || "Non renseign\xE9"),
    escapeCsv(r.userEmail || "Non renseign\xE9"),
    escapeCsv(r.tournamentName || tournamentsMap.get(r.tournamentId) || r.tournamentId),
    escapeCsv(r.teamSelected || "Non sp\xE9cifi\xE9e"),
    escapeCsv(r.controllerPreference || "Manette standard"),
    escapeCsv(new Date(r.registeredAt).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })),
    escapeCsv(r.status.toUpperCase()),
    escapeCsv(r.notes || "")
  ]);
  const csvContent = "\uFEFF" + [header.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");
  const filename = `inscriptions-fc-tournament-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
});
app.put("/api/admin/registrations/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "rejected"].includes(status)) {
    res.status(400).json({ error: "Statut invalide." });
    return;
  }
  const regIndex = db.registrations.findIndex((r) => r.id === req.params.id);
  if (regIndex === -1) {
    res.status(404).json({ error: "Inscription introuvable." });
    return;
  }
  const reg = db.registrations[regIndex];
  reg.status = status;
  let emailNotificationResult = { sent: false };
  if (status === "confirmed" && reg.whatsappInviteStatus !== "sent") {
    const email = reg.userEmail;
    if (email) {
      const sendResult = await sendWhatsAppInviteEmail(
        email,
        reg.playerName,
        reg.gamertag,
        reg.tournamentName
      );
      reg.whatsappInviteAttempts = (reg.whatsappInviteAttempts || 0) + 1;
      if (sendResult.success) {
        reg.whatsappInviteStatus = "sent";
        reg.whatsappInviteSentAt = (/* @__PURE__ */ new Date()).toISOString();
        delete reg.whatsappInviteError;
        emailNotificationResult = { sent: true };
      } else {
        reg.whatsappInviteStatus = "failed";
        reg.whatsappInviteError = sendResult.error || "\xC9chec de l'envoi de l'e-mail";
        emailNotificationResult = { sent: false, error: reg.whatsappInviteError };
      }
    } else {
      reg.whatsappInviteStatus = "failed";
      reg.whatsappInviteError = "Aucune adresse e-mail valide fournie.";
      emailNotificationResult = { sent: false, error: reg.whatsappInviteError };
    }
  }
  saveDatabase(db);
  const message = status === "confirmed" ? emailNotificationResult.sent ? "Inscription valid\xE9e ! L'invitation au groupe WhatsApp a \xE9t\xE9 envoy\xE9e par email au joueur." : reg.whatsappInviteStatus === "sent" ? "Inscription valid\xE9e (invitation WhatsApp d\xE9j\xE0 envoy\xE9e pr\xE9c\xE9demment)." : `Inscription valid\xE9e, mais l'envoi de l'invitation WhatsApp a \xE9chou\xE9 : ${emailNotificationResult.error}` : `Statut modifi\xE9 avec succ\xE8s : ${status}.`;
  res.json({
    registration: reg,
    emailSent: emailNotificationResult.sent,
    message
  });
});
app.post("/api/admin/registrations/:id/resend-whatsapp", requireAdmin, async (req, res) => {
  const reg = db.registrations.find((r) => r.id === req.params.id);
  if (!reg) {
    res.status(404).json({ error: "Inscription introuvable." });
    return;
  }
  if (reg.status !== "confirmed") {
    res.status(400).json({
      error: "L'invitation WhatsApp ne peut \xEAtre envoy\xE9e qu'aux participants dont l'inscription est valid\xE9e (Accept\xE9e)."
    });
    return;
  }
  if (!reg.userEmail) {
    res.status(400).json({ error: "Aucune adresse e-mail trouv\xE9e pour ce joueur." });
    return;
  }
  const sendResult = await sendWhatsAppInviteEmail(
    reg.userEmail,
    reg.playerName,
    reg.gamertag,
    reg.tournamentName
  );
  reg.whatsappInviteAttempts = (reg.whatsappInviteAttempts || 0) + 1;
  if (sendResult.success) {
    reg.whatsappInviteStatus = "sent";
    reg.whatsappInviteSentAt = (/* @__PURE__ */ new Date()).toISOString();
    delete reg.whatsappInviteError;
    saveDatabase(db);
    res.json({
      success: true,
      registration: reg,
      message: `Invitation au groupe WhatsApp envoy\xE9e avec succ\xE8s \xE0 ${reg.userEmail}.`
    });
  } else {
    reg.whatsappInviteStatus = "failed";
    reg.whatsappInviteError = sendResult.error || "\xC9chec de l'envoi";
    saveDatabase(db);
    res.status(500).json({
      success: false,
      registration: reg,
      error: `\xC9chec de l'envoi de l'e-mail : ${sendResult.error}`
    });
  }
});
app.delete("/api/admin/registrations/:id", requireAdmin, (req, res) => {
  const regIndex = db.registrations.findIndex((r) => r.id === req.params.id);
  if (regIndex === -1) {
    res.status(404).json({ error: "Inscription introuvable." });
    return;
  }
  db.registrations.splice(regIndex, 1);
  saveDatabase(db);
  res.json({ success: true, message: "Inscription supprim\xE9e avec succ\xE8s." });
});
app.get("/api/admin/registrations/:id/payment-proof", requireAdmin, (req, res) => {
  const reg = db.registrations.find((r) => r.id === req.params.id);
  if (!reg || !reg.paymentProof) {
    res.status(404).json({ error: "Capture d'\xE9cran du paiement introuvable pour cette inscription." });
    return;
  }
  const matches = reg.paymentProof.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    res.status(400).json({ error: "Format de la capture d'\xE9cran invalide." });
    return;
  }
  const mimeSubtype = matches[1].toLowerCase();
  const ext = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype;
  const imageBuffer = Buffer.from(matches[2], "base64");
  const safeGamertag = reg.gamertag.replace(/[^a-zA-Z0-9_-]/g, "_") || "joueur";
  const filename = `preuve-paiement-${safeGamertag}-${reg.id}.${ext}`;
  res.setHeader("Content-Type", `image/${mimeSubtype}`);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-cache");
  res.send(imageBuffer);
});
app.get("/api/admin/notifications", requireAdmin, (_req, res) => {
  const notifs = db.notifications || [];
  const unreadCount = notifs.filter((n) => !n.read).length;
  res.json({
    notifications: notifs,
    unreadCount
  });
});
app.put("/api/admin/notifications/:id/read", requireAdmin, (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveDatabase(db);
  }
  res.json({ success: true });
});
app.put("/api/admin/notifications/mark-all-read", requireAdmin, (_req, res) => {
  db.notifications.forEach((n) => {
    n.read = true;
  });
  saveDatabase(db);
  res.json({ success: true, message: "Toutes les notifications ont \xE9t\xE9 marqu\xE9es comme lues." });
});
app.delete("/api/admin/notifications/:id", requireAdmin, (req, res) => {
  const idx = db.notifications.findIndex((n) => n.id === req.params.id);
  if (idx !== -1) {
    db.notifications.splice(idx, 1);
    saveDatabase(db);
  }
  res.json({ success: true });
});
app.delete("/api/admin/notifications", requireAdmin, (_req, res) => {
  db.notifications = [];
  saveDatabase(db);
  res.json({ success: true, message: "Toutes les notifications ont \xE9t\xE9 supprim\xE9es." });
});
app.post("/api/admin/tournaments/:id/generate-bracket", requireAdmin, (req, res) => {
  const tournament = db.tournaments.find((t) => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournoi introuvable." });
    return;
  }
  const confirmedRegs = db.registrations.filter(
    (r) => r.tournamentId === tournament.id && r.status === "confirmed"
  );
  if (confirmedRegs.length < 2) {
    res.status(400).json({ error: "Au moins 2 joueurs confirm\xE9s sont n\xE9cessaires pour g\xE9n\xE9rer les confrontations." });
    return;
  }
  db.matches = db.matches.filter((m) => m.tournamentId !== tournament.id);
  const isLeague = tournament.format === "aller_retour" || tournament.format === "championship" || tournament.name.toLowerCase().includes("championnat");
  const newMatches = [];
  const dateStr = tournament.startDate;
  if (isLeague) {
    const players = [...confirmedRegs];
    const isOdd = players.length % 2 !== 0;
    const numPlayers = isOdd ? players.length + 1 : players.length;
    const roundCount = numPlayers - 1;
    const matchesPerRound = Math.floor(numPlayers / 2);
    let indices = Array.from({ length: numPlayers }, (_, i) => i);
    const baseDate = new Date(tournament.startDate || "2026-04-25");
    for (let round = 0; round < roundCount; round++) {
      const roundNum = round + 1;
      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + round * 7);
      const matchDateStr = matchDate.toISOString().slice(0, 10);
      for (let m = 0; m < matchesPerRound; m++) {
        const homeIdx = indices[m];
        const awayIdx = indices[numPlayers - 1 - m];
        if (isOdd && (homeIdx >= players.length || awayIdx >= players.length)) {
          continue;
        }
        const p1 = players[homeIdx];
        const p2 = players[awayIdx];
        const [homePlayer, awayPlayer] = round % 2 === 0 ? [p1, p2] : [p2, p1];
        const matchHour = 15 + m % 5;
        const matchTimeStr = `${matchHour.toString().padStart(2, "0")}:00`;
        newMatches.push({
          id: `match_${tournament.id}_j${roundNum}_m${m + 1}`,
          tournamentId: tournament.id,
          stage: "league",
          stageName: `Journ\xE9e ${roundNum}`,
          round: roundNum,
          matchNumber: m + 1,
          player1Id: homePlayer.userId,
          player1Gamertag: homePlayer.gamertag,
          player1Score: null,
          player2Id: awayPlayer.userId,
          player2Gamertag: awayPlayer.gamertag,
          player2Score: null,
          status: "scheduled",
          winnerId: null,
          scheduledDate: matchDateStr,
          scheduledTime: matchTimeStr,
          validatedByAdmin: false,
          auditLog: [
            {
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              adminName: req.user.gamertag,
              action: "LEAGUE_DRAW_GENERATION",
              note: `Calendrier officiel Championnat - Journ\xE9e ${roundNum} match #${m + 1}.`
            }
          ]
        });
      }
      indices = [indices[0], indices[numPlayers - 1], ...indices.slice(1, numPlayers - 1)];
    }
    tournament.status = "ongoing";
    db.matches.push(...newMatches);
    saveDatabase(db);
    res.json({
      matches: newMatches,
      message: `Calendrier officiel du Championnat g\xE9n\xE9r\xE9 (${newMatches.length} matchs sur ${roundCount} journ\xE9es).`
    });
    return;
  }
  const shuffled = [...confirmedRegs].sort(() => 0.5 - Math.random());
  const matchCount = Math.floor(shuffled.length / 2);
  if (matchCount >= 4) {
    for (let i = 0; i < 4; i++) {
      const p1 = shuffled[i * 2];
      const p2 = shuffled[i * 2 + 1];
      const targetSemiIndex = i < 2 ? 1 : 2;
      const targetSemiSlot = i % 2 === 0 ? 1 : 2;
      newMatches.push({
        id: `match_${tournament.id}_qf${i + 1}`,
        tournamentId: tournament.id,
        stage: "quarter_final",
        stageName: `Quart de Finale ${i + 1}`,
        round: 1,
        matchNumber: i + 1,
        nextMatchId: `match_${tournament.id}_sf${targetSemiIndex}`,
        nextMatchSlot: targetSemiSlot,
        player1Id: p1 ? p1.userId : null,
        player1Gamertag: p1 ? p1.gamertag : "En attente",
        player1Score: null,
        player2Id: p2 ? p2.userId : null,
        player2Gamertag: p2 ? p2.gamertag : "En attente",
        player2Score: null,
        status: "scheduled",
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: tournament.time || "15:00",
        validatedByAdmin: false,
        auditLog: [
          {
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            adminName: req.user.gamertag,
            action: "BRACKET_GENERATION",
            note: `Tirage au sort officiel - Quart de Finale ${i + 1}.`
          }
        ]
      });
    }
  } else {
    for (let i = 0; i < matchCount; i++) {
      const p1 = shuffled[i * 2];
      const p2 = shuffled[i * 2 + 1];
      newMatches.push({
        id: `match_${tournament.id}_sf${i + 1}`,
        tournamentId: tournament.id,
        stage: "semi_final",
        stageName: `Demi-Finale ${i + 1}`,
        round: 1,
        matchNumber: i + 1,
        nextMatchId: `match_${tournament.id}_final`,
        nextMatchSlot: i === 0 ? 1 : 2,
        player1Id: p1 ? p1.userId : null,
        player1Gamertag: p1 ? p1.gamertag : "En attente",
        player1Score: null,
        player2Id: p2 ? p2.userId : null,
        player2Gamertag: p2 ? p2.gamertag : "En attente",
        player2Score: null,
        status: "scheduled",
        winnerId: null,
        scheduledDate: dateStr,
        scheduledTime: tournament.time || "16:00",
        validatedByAdmin: false,
        auditLog: [
          {
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            adminName: req.user.gamertag,
            action: "BRACKET_GENERATION",
            note: `Tirage au sort officiel - Demi-Finale ${i + 1}.`
          }
        ]
      });
    }
  }
  if (matchCount >= 4) {
    newMatches.push({
      id: `match_${tournament.id}_sf1`,
      tournamentId: tournament.id,
      stage: "semi_final",
      stageName: "Demi-Finale 1",
      round: 2,
      matchNumber: 1,
      nextMatchId: `match_${tournament.id}_final`,
      nextMatchSlot: 1,
      player1Id: null,
      player1Gamertag: "Vainqueur Quart 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Quart 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: dateStr,
      scheduledTime: "17:30",
      validatedByAdmin: false,
      auditLog: []
    });
    newMatches.push({
      id: `match_${tournament.id}_sf2`,
      tournamentId: tournament.id,
      stage: "semi_final",
      stageName: "Demi-Finale 2",
      round: 2,
      matchNumber: 2,
      nextMatchId: `match_${tournament.id}_final`,
      nextMatchSlot: 2,
      player1Id: null,
      player1Gamertag: "Vainqueur Quart 3",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Quart 4",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: dateStr,
      scheduledTime: "18:15",
      validatedByAdmin: false,
      auditLog: []
    });
    newMatches.push({
      id: `match_${tournament.id}_final`,
      tournamentId: tournament.id,
      stage: "final",
      stageName: "Grande Finale",
      round: 3,
      matchNumber: 1,
      nextMatchId: null,
      player1Id: null,
      player1Gamertag: "Vainqueur Demi 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Demi 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: dateStr,
      scheduledTime: "19:30",
      validatedByAdmin: false,
      auditLog: []
    });
  } else if (matchCount === 2) {
    newMatches.push({
      id: `match_${tournament.id}_final`,
      tournamentId: tournament.id,
      stage: "final",
      stageName: "Grande Finale",
      round: 2,
      matchNumber: 1,
      player1Id: null,
      player1Gamertag: "Vainqueur Demi 1",
      player1Score: null,
      player2Id: null,
      player2Gamertag: "Vainqueur Demi 2",
      player2Score: null,
      status: "scheduled",
      winnerId: null,
      scheduledDate: dateStr,
      scheduledTime: "19:00",
      validatedByAdmin: false,
      auditLog: []
    });
    newMatches[0].nextMatchId = `match_${tournament.id}_final`;
    newMatches[0].nextMatchSlot = 1;
    newMatches[1].nextMatchId = `match_${tournament.id}_final`;
    newMatches[1].nextMatchSlot = 2;
  }
  tournament.status = "ongoing";
  db.matches.push(...newMatches);
  saveDatabase(db);
  res.json({
    matches: newMatches,
    message: `${newMatches.length} confrontations g\xE9n\xE9r\xE9es et tournoi pass\xE9 en statut \xAB En cours \xBB.`
  });
});
app.put("/api/admin/matches/:id/score", requireAdmin, (req, res) => {
  const { score1, score2, note } = req.body;
  const matchIndex = db.matches.findIndex((m) => m.id === req.params.id);
  if (matchIndex === -1) {
    res.status(404).json({ error: "Match introuvable." });
    return;
  }
  const match = db.matches[matchIndex];
  const s1 = parseInt(score1, 10);
  const s2 = parseInt(score2, 10);
  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
    res.status(400).json({ error: "Scores invalides. Veuillez entrer des nombres entiers positifs." });
    return;
  }
  if (s1 === s2) {
    res.status(400).json({ error: "En phase \xE9liminatoire, un match ne peut se terminer sur un score nul (veuillez inclure les tirs au but)." });
    return;
  }
  const winnerId = s1 > s2 ? match.player1Id : match.player2Id;
  const winnerGamertag = s1 > s2 ? match.player1Gamertag : match.player2Gamertag;
  match.player1Score = s1;
  match.player2Score = s2;
  match.winnerId = winnerId;
  match.status = "completed";
  match.validatedByAdmin = true;
  const auditEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    adminName: req.user.gamertag,
    action: "SCORE_UPDATE_AND_VALIDATION",
    note: note || `Score valid\xE9 : ${match.player1Gamertag} (${s1}) - (${s2}) ${match.player2Gamertag}. Vainqueur : ${winnerGamertag}.`
  };
  match.auditLog.push(auditEntry);
  if (match.nextMatchId && winnerId) {
    const nextMatch = db.matches.find((m) => m.id === match.nextMatchId);
    if (nextMatch) {
      if (match.nextMatchSlot === 1) {
        nextMatch.player1Id = winnerId;
        nextMatch.player1Gamertag = winnerGamertag;
      } else if (match.nextMatchSlot === 2) {
        nextMatch.player2Id = winnerId;
        nextMatch.player2Gamertag = winnerGamertag;
      }
    }
  }
  saveDatabase(db);
  res.json({ match, message: `Score officiellement valid\xE9 ! Vainqueur qualifi\xE9 : ${winnerGamertag}.` });
});
app.get("/api/admin/stats", requireAdmin, (_req, res) => {
  res.json({
    totalTournaments: db.tournaments.length,
    activeTournaments: db.tournaments.filter((t) => t.status === "ongoing" || t.status === "open").length,
    totalPlayers: db.users.filter((u) => u.role === "player").length,
    totalRegistrations: db.registrations.length,
    pendingRegistrations: db.registrations.filter((r) => r.status === "pending").length,
    totalMatches: db.matches.length,
    completedMatches: db.matches.filter((m) => m.status === "completed").length,
    contacts: db.contacts
  });
});
app.post("/api/admin/recalculate-leaderboard", requireAdmin, (_req, res) => {
  const rankings = computeLeaderboard();
  res.json({
    rankings,
    message: "Points et classement g\xE9n\xE9ral recalcul\xE9s avec succ\xE8s selon les r\xE9sultats homologu\xE9s."
  });
});
async function startServer() {
  const isViteDev = process.env.NODE_ENV !== "production" && fileURLToPath(import.meta.url).endsWith(".ts") && fs.existsSync(path.resolve(__dirname, "src"));
  function serveStaticProduction() {
    let staticDir = path.resolve(__dirname, "dist");
    let indexHtmlPath = path.resolve(staticDir, "index.html");
    if (!fs.existsSync(indexHtmlPath) && fs.existsSync(path.resolve(__dirname, "index.html"))) {
      staticDir = __dirname;
      indexHtmlPath = path.resolve(__dirname, "index.html");
    }
    app.use(express.static(staticDir));
    app.use("*", (_req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(404).send("Application build not found. Please upload index.html or dist/ folder.");
      }
    });
  }
  if (isViteDev) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        try {
          const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } catch (viteErr) {
      console.warn("Vite dev middleware could not be loaded, falling back to static serving:", viteErr);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }
  if (typeof PORT === "number") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`FC Tournament Server running on port ${PORT}`);
    });
  } else {
    app.listen(PORT, () => {
      console.log(`FC Tournament Server running on socket ${PORT}`);
    });
  }
}
var server_default = app;
const isVercelServerless = Boolean(process.env.VERCEL);
if (!isVercelServerless) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
export {
  app,
  server_default as default
};
