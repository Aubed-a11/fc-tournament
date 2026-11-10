import type { Tournament, Match, PlayerLeaderboard, Registration } from "../types/index.ts";

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    "id": "tourn_spring_2026",
    "name": "Championnat",
    "slug": "championnat-fc-2026",
    "description": "Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour célébrer la compétition et couronner le meilleur joueur dans une ambiance électrique devant vos écrans.",
    "gameVersion": "EA SPORTS 27",
    "platform": "e-Football",
    "format": "aller_retour",
    "location": "Gaming Arena",
    "city": "Maroc",
    "startDate": "2027-04-25",
    "time": "14:00",
    "registrationDeadline": "2027-04-23T23:59:00.000Z",
    "maxParticipants": 32,
    "entryFeeMAD": 50,
    "prizePool": "**** MAD + Trophée + T-shirt",
    "status": "open",
    "rules": "Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.\nArticle 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.\nArticle 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.\nArticle 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.\nArticle 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.\nArticle 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.\nArticle 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.",
    "bannerImage": "/assets/aistudio/f455c630-cebe-4da1-8e64-ad18d396300f_73791cd5.png",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "participantsCount": 12,
    "confirmedCount": 12,
    "userRegistration": null
  },
  {
    "id": "tourn_ligue_oriental_2026",
    "name": "Ligue des champions",
    "slug": "ligue-des-champions",
    "description": "La compétition d’élite qui réunit les meilleurs joueurs pour s’affronter et décrocher le titre de champion.",
    "gameVersion": "EA SPORTS 27",
    "platform": "e-Football",
    "format": "aller_retour",
    "location": "Gaming Arena",
    "city": "Maroc",
    "startDate": "2026-03-14",
    "time": "16:00",
    "registrationDeadline": "2026-03-12T18:00:00.000Z",
    "maxParticipants": 32,
    "entryFeeMAD": 50,
    "prizePool": "**** MAD + Trophée + T-shirt",
    "status": "open",
    "rules": "Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.\nArticle 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.\nArticle 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.\nArticle 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.\nArticle 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.\nArticle 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.\nArticle 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.",
    "bannerImage": "/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png",
    "createdAt": "2026-01-20T12:00:00.000Z",
    "participantsCount": 8,
    "confirmedCount": 8,
    "userRegistration": null
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    "id": "match_oriental_qf1",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "quarter_final",
    "stageName": "Quart de Finale 1",
    "round": 1,
    "matchNumber": 1,
    "nextMatchId": "match_oriental_sf1",
    "nextMatchSlot": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": 3,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": 1,
    "status": "completed",
    "winnerId": "usr_amine",
    "scheduledDate": "2026-03-14",
    "scheduledTime": "16:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-03-14T16:25:00.000Z",
        "adminName": "Admin_FC",
        "action": "VALIDATION_SCORE",
        "note": "Score officiel vérifié et validé sur la console 1."
      }
    ]
  },
  {
    "id": "match_oriental_qf2",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "quarter_final",
    "stageName": "Quart de Finale 2",
    "round": 1,
    "matchNumber": 2,
    "nextMatchId": "match_oriental_sf1",
    "nextMatchSlot": 2,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": 2,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": 0,
    "status": "completed",
    "winnerId": "usr_bilal",
    "scheduledDate": "2026-03-14",
    "scheduledTime": "16:30",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-03-14T16:55:00.000Z",
        "adminName": "Admin_FC",
        "action": "VALIDATION_SCORE",
        "note": "Score 2-0 validé. FC_Sniper qualifié en demi."
      }
    ]
  },
  {
    "id": "match_oriental_qf3",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "quarter_final",
    "stageName": "Quart de Finale 3",
    "round": 1,
    "matchNumber": 3,
    "nextMatchId": "match_oriental_sf2",
    "nextMatchSlot": 1,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": 4,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": 2,
    "status": "completed",
    "winnerId": "usr_reda",
    "scheduledDate": "2026-03-14",
    "scheduledTime": "17:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-03-14T17:28:00.000Z",
        "adminName": "Admin_FC",
        "action": "VALIDATION_SCORE",
        "note": "Score 4-2 validé. Reda_TheKing qualifié."
      }
    ]
  },
  {
    "id": "match_oriental_qf4",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "quarter_final",
    "stageName": "Quart de Finale 4",
    "round": 1,
    "matchNumber": 4,
    "nextMatchId": "match_oriental_sf2",
    "nextMatchSlot": 2,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": 3,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": 2,
    "status": "completed",
    "winnerId": "usr_yassine",
    "scheduledDate": "2026-03-14",
    "scheduledTime": "17:30",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-03-14T17:58:00.000Z",
        "adminName": "Admin_FC",
        "action": "VALIDATION_SCORE",
        "note": "Score 3-2 en prolongation. Yassine_99 qualifié."
      }
    ]
  },
  {
    "id": "match_oriental_sf1",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "semi_final",
    "stageName": "Demi-Finale 1",
    "round": 2,
    "matchNumber": 1,
    "nextMatchId": "match_oriental_final",
    "nextMatchSlot": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": 1,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": 3,
    "status": "completed",
    "winnerId": "usr_bilal",
    "scheduledDate": "2026-03-14",
    "scheduledTime": "18:30",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T16:54:37.225Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Score validé : Amine_FC (1) - (3) FC_Sniper. Vainqueur : FC_Sniper."
      }
    ]
  },
  {
    "id": "match_oriental_sf2",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "semi_final",
    "stageName": "Demi-Finale 2",
    "round": 2,
    "matchNumber": 2,
    "nextMatchId": "match_oriental_final",
    "nextMatchSlot": 2,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2026-03-14",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": []
  },
  {
    "id": "match_oriental_final",
    "tournamentId": "tourn_ligue_oriental_2026",
    "stage": "final",
    "stageName": "Grande Finale",
    "round": 3,
    "matchNumber": 1,
    "nextMatchId": null,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": 1,
    "player2Id": null,
    "player2Gamertag": "Vainqueur Demi 2",
    "player2Score": 8,
    "status": "completed",
    "winnerId": null,
    "scheduledDate": "2026-03-14",
    "scheduledTime": "20:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T16:54:49.640Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Score validé : FC_Sniper (1) - (8) Vainqueur Demi 2. Vainqueur : Vainqueur Demi 2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": 3,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": 1,
    "status": "completed",
    "winnerId": "usr_amine",
    "scheduledDate": "2027-04-25",
    "scheduledTime": "15:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #1."
      },
      {
        "timestamp": "2026-11-03T17:47:48.042Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Match d’ouverture spectaculaire. Victoire nette à domicile."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 2,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_soufiane",
    "player2Gamertag": "Souf_Skiller",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-04-25",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 3,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": 4,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": 0,
    "status": "completed",
    "winnerId": "usr_yassine",
    "scheduledDate": "2027-04-25",
    "scheduledTime": "17:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #3."
      },
      {
        "timestamp": "2026-11-03T17:47:48.048Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Festival offensif et clean-sheet."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 4,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": 1,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": 2,
    "status": "completed",
    "winnerId": "usr_karim",
    "scheduledDate": "2027-04-25",
    "scheduledTime": "18:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #4."
      },
      {
        "timestamp": "2026-11-03T17:47:48.052Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Victoire à l’extérieur arrachée à la 88e minute."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 5,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-04-25",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j1_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 1",
    "round": 1,
    "matchNumber": 6,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": 3,
    "player2Id": "guest_1793725437285_sccv",
    "player2Gamertag": "Omar_Maestro",
    "player2Score": 2,
    "status": "completed",
    "winnerId": "usr_simoo",
    "scheduledDate": "2027-04-25",
    "scheduledTime": "15:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 1 match #6."
      },
      {
        "timestamp": "2026-11-03T17:47:48.057Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Dénouement haletant en fin de partie."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 1,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": 2,
    "player2Id": "usr_amine",
    "player2Gamertag": "Amine_FC",
    "player2Score": 0,
    "status": "completed",
    "winnerId": "usr_soufiane",
    "scheduledDate": "2027-05-02",
    "scheduledTime": "15:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #1."
      },
      {
        "timestamp": "2026-11-03T17:47:48.061Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Victoire solide 2-0 sans trembler."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 2,
    "player1Id": "usr_tariq",
    "player1Gamertag": "Tariq_Pro9",
    "player1Score": 1,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": 3,
    "status": "completed",
    "winnerId": "usr_ayoub",
    "scheduledDate": "2027-05-02",
    "scheduledTime": "16:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #2."
      },
      {
        "timestamp": "2026-11-03T17:47:48.066Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Démonstration collective du visiteur."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 3,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "usr_reda",
    "player2Gamertag": "Reda_TheKing",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-02",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 4,
    "player1Id": "usr_hamza",
    "player1Gamertag": "Hamza_FCB",
    "player1Score": 2,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": 1,
    "status": "completed",
    "winnerId": "usr_hamza",
    "scheduledDate": "2027-05-02",
    "scheduledTime": "18:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #4."
      },
      {
        "timestamp": "2026-11-03T17:47:48.071Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Succès 2-1 devant le public."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 5,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": 0,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": 1,
    "status": "completed",
    "winnerId": "usr_bilal",
    "scheduledDate": "2027-05-02",
    "scheduledTime": "19:00",
    "validatedByAdmin": true,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #5."
      },
      {
        "timestamp": "2026-11-03T17:47:48.073Z",
        "adminName": "Admin_FC",
        "action": "SCORE_UPDATE_AND_VALIDATION",
        "note": "Courte victoire 0-1 sur contre-attaque."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j2_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 2",
    "round": 2,
    "matchNumber": 6,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": null,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-02",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 2 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 2,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": null,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 3,
    "player1Id": "usr_ayoub",
    "player1Gamertag": "Ayoub_Striker",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 4,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "guest_1793725437285_sccv",
    "player2Gamertag": "Omar_Maestro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 5,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": null,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j3_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 3",
    "round": 3,
    "matchNumber": 6,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": null,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-09",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 3 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 1,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "usr_amine",
    "player2Gamertag": "Amine_FC",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 2,
    "player1Id": "usr_hamza",
    "player1Gamertag": "Hamza_FCB",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 3,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": null,
    "player2Id": "usr_soufiane",
    "player2Gamertag": "Souf_Skiller",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 4,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": null,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 5,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_reda",
    "player2Gamertag": "Reda_TheKing",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j4_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 4",
    "round": 4,
    "matchNumber": 6,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": null,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-16",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 4 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 2,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "guest_1793725437285_sccv",
    "player2Gamertag": "Omar_Maestro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 3,
    "player1Id": "usr_tariq",
    "player1Gamertag": "Tariq_Pro9",
    "player1Score": null,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 4,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": null,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 5,
    "player1Id": "usr_ayoub",
    "player1Gamertag": "Ayoub_Striker",
    "player1Score": null,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j5_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 5",
    "round": 5,
    "matchNumber": 6,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-23",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 5 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 1,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": null,
    "player2Id": "usr_amine",
    "player2Gamertag": "Amine_FC",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 2,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 3,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 4,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 5,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": null,
    "player2Id": "usr_soufiane",
    "player2Gamertag": "Souf_Skiller",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j6_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 6",
    "round": 6,
    "matchNumber": 6,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-05-30",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 6 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": null,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 2,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": null,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 3,
    "player1Id": "usr_hamza",
    "player1Gamertag": "Hamza_FCB",
    "player1Score": null,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 4,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 5,
    "player1Id": "usr_tariq",
    "player1Gamertag": "Tariq_Pro9",
    "player1Score": null,
    "player2Id": "usr_reda",
    "player2Gamertag": "Reda_TheKing",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j7_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 7",
    "round": 7,
    "matchNumber": 6,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": null,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-06",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 7 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 1,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_amine",
    "player2Gamertag": "Amine_FC",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 2,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": null,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 3,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": null,
    "player2Id": "guest_1793725437285_sccv",
    "player2Gamertag": "Omar_Maestro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 4,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 5,
    "player1Id": "usr_ayoub",
    "player1Gamertag": "Ayoub_Striker",
    "player1Score": null,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j8_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 8",
    "round": 8,
    "matchNumber": 6,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-13",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 8 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": null,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 2,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_yassine",
    "player2Gamertag": "Yassine_99",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 3,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": null,
    "player2Id": "usr_reda",
    "player2Gamertag": "Reda_TheKing",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 4,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": null,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 5,
    "player1Id": "usr_hamza",
    "player1Gamertag": "Hamza_FCB",
    "player1Score": null,
    "player2Id": "usr_soufiane",
    "player2Gamertag": "Souf_Skiller",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j9_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 9",
    "round": 9,
    "matchNumber": 6,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-20",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 9 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 1,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": null,
    "player2Id": "usr_amine",
    "player2Gamertag": "Amine_FC",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 2,
    "player1Id": "usr_reda",
    "player1Gamertag": "Reda_TheKing",
    "player1Score": null,
    "player2Id": "usr_bilal",
    "player2Gamertag": "FC_Sniper",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 3,
    "player1Id": "usr_ayoub",
    "player1Gamertag": "Ayoub_Striker",
    "player1Score": null,
    "player2Id": "usr_mehdi",
    "player2Gamertag": "Mehdi_Pro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 4,
    "player1Id": "usr_soufiane",
    "player1Gamertag": "Souf_Skiller",
    "player1Score": null,
    "player2Id": "usr_simoo",
    "player2Gamertag": "Simoo_Dribble",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 5,
    "player1Id": "usr_tariq",
    "player1Gamertag": "Tariq_Pro9",
    "player1Score": null,
    "player2Id": "guest_1793725437285_sccv",
    "player2Gamertag": "Omar_Maestro",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j10_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 10",
    "round": 10,
    "matchNumber": 6,
    "player1Id": "usr_karim",
    "player1Gamertag": "Karim_Atlas",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-06-27",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 10 match #6."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m1",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 1,
    "player1Id": "usr_amine",
    "player1Gamertag": "Amine_FC",
    "player1Score": null,
    "player2Id": "usr_reda",
    "player2Gamertag": "Reda_TheKing",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #1."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m2",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 2,
    "player1Id": "usr_yassine",
    "player1Gamertag": "Yassine_99",
    "player1Score": null,
    "player2Id": "usr_ayoub",
    "player2Gamertag": "Ayoub_Striker",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "16:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #2."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m3",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 3,
    "player1Id": "usr_bilal",
    "player1Gamertag": "FC_Sniper",
    "player1Score": null,
    "player2Id": "usr_soufiane",
    "player2Gamertag": "Souf_Skiller",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "17:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #3."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m4",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 4,
    "player1Id": "usr_mehdi",
    "player1Gamertag": "Mehdi_Pro",
    "player1Score": null,
    "player2Id": "usr_tariq",
    "player2Gamertag": "Tariq_Pro9",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "18:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #4."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m5",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 5,
    "player1Id": "usr_simoo",
    "player1Gamertag": "Simoo_Dribble",
    "player1Score": null,
    "player2Id": "usr_karim",
    "player2Gamertag": "Karim_Atlas",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "19:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #5."
      }
    ]
  },
  {
    "id": "match_tourn_spring_2026_j11_m6",
    "tournamentId": "tourn_spring_2026",
    "stage": "league",
    "stageName": "Journée 11",
    "round": 11,
    "matchNumber": 6,
    "player1Id": "guest_1793725437285_sccv",
    "player1Gamertag": "Omar_Maestro",
    "player1Score": null,
    "player2Id": "usr_hamza",
    "player2Gamertag": "Hamza_FCB",
    "player2Score": null,
    "status": "scheduled",
    "winnerId": null,
    "scheduledDate": "2027-07-04",
    "scheduledTime": "15:00",
    "validatedByAdmin": false,
    "auditLog": [
      {
        "timestamp": "2026-11-03T17:47:35.037Z",
        "adminName": "Admin_FC",
        "action": "LEAGUE_DRAW_GENERATION",
        "note": "Calendrier officiel Championnat - Journée 11 match #6."
      }
    ]
  }
];

export const INITIAL_LEADERBOARD: PlayerLeaderboard[] = [
  {
    "userId": "usr_bilal",
    "gamertag": "FC_Sniper",
    "playerName": "Bilal Tahiri",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=FC_Sniper",
    "tournamentsPlayed": 0,
    "matchesPlayed": 5,
    "wins": 3,
    "draws": 0,
    "losses": 2,
    "goalsFor": 8,
    "goalsAgainst": 11,
    "goalDifference": -3,
    "points": 9,
    "winRate": 60,
    "trophies": 0,
    "rank": 1
  },
  {
    "userId": "usr_yassine",
    "gamertag": "Yassine_99",
    "playerName": "Yassine Mansouri",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Yassine_99",
    "tournamentsPlayed": 0,
    "matchesPlayed": 3,
    "wins": 2,
    "draws": 0,
    "losses": 1,
    "goalsFor": 8,
    "goalsAgainst": 4,
    "goalDifference": 4,
    "points": 6,
    "winRate": 67,
    "trophies": 0,
    "rank": 2
  },
  {
    "userId": "usr_amine",
    "gamertag": "Amine_FC",
    "playerName": "Amine Bennani",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Amine_FC",
    "tournamentsPlayed": 0,
    "matchesPlayed": 4,
    "wins": 2,
    "draws": 0,
    "losses": 2,
    "goalsFor": 7,
    "goalsAgainst": 7,
    "goalDifference": 0,
    "points": 6,
    "winRate": 50,
    "trophies": 0,
    "rank": 3
  },
  {
    "userId": "usr_placeholder_semi2",
    "gamertag": "Vainqueur Demi 2",
    "playerName": "Vainqueur Demi 2",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Vainqueur%20Demi%202",
    "tournamentsPlayed": 0,
    "matchesPlayed": 1,
    "wins": 1,
    "draws": 0,
    "losses": 0,
    "goalsFor": 8,
    "goalsAgainst": 1,
    "goalDifference": 7,
    "points": 3,
    "winRate": 100,
    "trophies": 0,
    "rank": 4
  },
  {
    "userId": "usr_reda",
    "gamertag": "Reda_TheKing",
    "playerName": "Reda Berrada",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Reda_TheKing",
    "tournamentsPlayed": 0,
    "matchesPlayed": 1,
    "wins": 1,
    "draws": 0,
    "losses": 0,
    "goalsFor": 4,
    "goalsAgainst": 2,
    "goalDifference": 2,
    "points": 3,
    "winRate": 100,
    "trophies": 0,
    "rank": 5
  },
  {
    "userId": "usr_soufiane",
    "gamertag": "Souf_Skiller",
    "playerName": "Soufiane El Fassi",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Souf_Skiller",
    "tournamentsPlayed": 0,
    "matchesPlayed": 1,
    "wins": 1,
    "draws": 0,
    "losses": 0,
    "goalsFor": 2,
    "goalsAgainst": 0,
    "goalDifference": 2,
    "points": 3,
    "winRate": 100,
    "trophies": 0,
    "rank": 6
  },
  {
    "userId": "usr_simoo",
    "gamertag": "Simoo_Dribble",
    "playerName": "Mohamed Ziani",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Simoo_Dribble",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 1,
    "draws": 0,
    "losses": 1,
    "goalsFor": 5,
    "goalsAgainst": 5,
    "goalDifference": 0,
    "points": 3,
    "winRate": 50,
    "trophies": 0,
    "rank": 7
  },
  {
    "userId": "usr_ayoub",
    "gamertag": "Ayoub_Striker",
    "playerName": "Ayoub Bennis",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Ayoub_Striker",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 1,
    "draws": 0,
    "losses": 1,
    "goalsFor": 4,
    "goalsAgainst": 4,
    "goalDifference": 0,
    "points": 3,
    "winRate": 50,
    "trophies": 0,
    "rank": 8
  },
  {
    "userId": "usr_hamza",
    "gamertag": "Hamza_FCB",
    "playerName": "Hamza Chaoui",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Hamza_FCB",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 1,
    "draws": 0,
    "losses": 1,
    "goalsFor": 4,
    "goalsAgainst": 5,
    "goalDifference": -1,
    "points": 3,
    "winRate": 50,
    "trophies": 0,
    "rank": 9
  },
  {
    "userId": "usr_karim",
    "gamertag": "Karim_Atlas",
    "playerName": "Karim Benali",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Karim_Atlas",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 1,
    "draws": 0,
    "losses": 1,
    "goalsFor": 3,
    "goalsAgainst": 4,
    "goalDifference": -1,
    "points": 3,
    "winRate": 50,
    "trophies": 0,
    "rank": 10
  },
  {
    "userId": "guest_1793725437285_sccv",
    "gamertag": "Omar_Maestro",
    "playerName": "Omar El Alami",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Omar_Maestro",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 0,
    "draws": 0,
    "losses": 2,
    "goalsFor": 2,
    "goalsAgainst": 4,
    "goalDifference": -2,
    "points": 0,
    "winRate": 0,
    "trophies": 0,
    "rank": 11
  },
  {
    "userId": "usr_mehdi",
    "gamertag": "Mehdi_Pro",
    "playerName": "Mehdi El Amrani",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Mehdi_Pro",
    "tournamentsPlayed": 0,
    "matchesPlayed": 1,
    "wins": 0,
    "draws": 0,
    "losses": 1,
    "goalsFor": 0,
    "goalsAgainst": 2,
    "goalDifference": -2,
    "points": 0,
    "winRate": 0,
    "trophies": 0,
    "rank": 12
  },
  {
    "userId": "usr_tariq",
    "gamertag": "Tariq_Pro9",
    "playerName": "Tariq Mansour",
    "avatarUrl": "https://api.dicebear.com/7.x/bottts/svg?seed=Tariq_Pro9",
    "tournamentsPlayed": 0,
    "matchesPlayed": 2,
    "wins": 0,
    "draws": 0,
    "losses": 2,
    "goalsFor": 1,
    "goalsAgainst": 7,
    "goalDifference": -6,
    "points": 0,
    "winRate": 0,
    "trophies": 0,
    "rank": 13
  }
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    "id": "reg_1",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_amine",
    "gamertag": "Amine_FC",
    "playerName": "Amine Bennani",
    "userEmail": "joueur@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-02T10:15:00.000Z",
    "seed": 1,
    "registrationNumber": "REG-2026-0001"
  },
  {
    "id": "reg_2",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_reda",
    "gamertag": "Reda_TheKing",
    "playerName": "Reda Berrada",
    "userEmail": "reda@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-02T11:30:00.000Z",
    "seed": 2,
    "whatsappInviteAttempts": 1,
    "whatsappInviteStatus": "sent",
    "whatsappInviteSentAt": "2026-11-04T13:02:52.807Z",
    "registrationNumber": "REG-2026-0002"
  },
  {
    "id": "reg_3",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_yassine",
    "gamertag": "Yassine_99",
    "playerName": "Yassine Mansouri",
    "userEmail": "yassine@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-03T14:20:00.000Z",
    "seed": 3,
    "registrationNumber": "REG-2026-0003"
  },
  {
    "id": "reg_4",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_bilal",
    "gamertag": "FC_Sniper",
    "playerName": "Bilal Tahiri",
    "userEmail": "bilal@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-04T09:45:00.000Z",
    "seed": 4,
    "registrationNumber": "REG-2026-0004"
  },
  {
    "id": "reg_5",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_mehdi",
    "gamertag": "Mehdi_Pro",
    "playerName": "Mehdi El Amrani",
    "userEmail": "mehdi@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-05T16:00:00.000Z",
    "seed": 5,
    "registrationNumber": "REG-2026-0005"
  },
  {
    "id": "reg_6",
    "tournamentId": "tourn_spring_2026",
    "userId": "usr_simoo",
    "gamertag": "Simoo_Dribble",
    "playerName": "Mohamed Ziani",
    "userEmail": "simoo@fctournament.ma",
    "status": "confirmed",
    "registeredAt": "2026-02-06T18:10:00.000Z",
    "seed": 6,
    "registrationNumber": "REG-2026-0006"
  },
  {
    "id": "reg_oriental_1",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_amine",
    "gamertag": "Amine_FC",
    "playerName": "Amine Bennani",
    "status": "confirmed",
    "registeredAt": "2026-02-01T10:00:00.000Z",
    "seed": 1,
    "registrationNumber": "REG-2026-0007"
  },
  {
    "id": "reg_oriental_2",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_reda",
    "gamertag": "Reda_TheKing",
    "playerName": "Reda Berrada",
    "status": "confirmed",
    "registeredAt": "2026-02-01T10:15:00.000Z",
    "seed": 2,
    "registrationNumber": "REG-2026-0008"
  },
  {
    "id": "reg_oriental_3",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_yassine",
    "gamertag": "Yassine_99",
    "playerName": "Yassine Mansouri",
    "status": "confirmed",
    "registeredAt": "2026-02-01T10:30:00.000Z",
    "seed": 3,
    "registrationNumber": "REG-2026-0009"
  },
  {
    "id": "reg_oriental_4",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_bilal",
    "gamertag": "FC_Sniper",
    "playerName": "Bilal Tahiri",
    "status": "confirmed",
    "registeredAt": "2026-02-01T10:45:00.000Z",
    "seed": 4,
    "registrationNumber": "REG-2026-0010"
  },
  {
    "id": "reg_oriental_5",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_mehdi",
    "gamertag": "Mehdi_Pro",
    "playerName": "Mehdi El Amrani",
    "status": "confirmed",
    "registeredAt": "2026-02-01T11:00:00.000Z",
    "seed": 5,
    "registrationNumber": "REG-2026-0011"
  },
  {
    "id": "reg_oriental_6",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_simoo",
    "gamertag": "Simoo_Dribble",
    "playerName": "Mohamed Ziani",
    "status": "confirmed",
    "registeredAt": "2026-02-01T11:15:00.000Z",
    "seed": 6,
    "registrationNumber": "REG-2026-0012"
  },
  {
    "id": "reg_oriental_7",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_hamza",
    "gamertag": "Hamza_FCB",
    "playerName": "Hamza Chaoui",
    "status": "confirmed",
    "registeredAt": "2026-02-01T11:30:00.000Z",
    "seed": 7,
    "registrationNumber": "REG-2026-0013"
  },
  {
    "id": "reg_oriental_8",
    "tournamentId": "tourn_ligue_oriental_2026",
    "userId": "usr_karim",
    "gamertag": "Karim_Atlas",
    "playerName": "Karim Benali",
    "status": "confirmed",
    "registeredAt": "2026-02-01T11:45:00.000Z",
    "seed": 8,
    "registrationNumber": "REG-2026-0014"
  },
  {
    "id": "reg_1793725437285_qkz9",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "guest_1793725437285_sccv",
    "gamertag": "Omar_Maestro",
    "playerName": "Omar El Alami",
    "userEmail": "omar.test@fctournament.ma",
    "phone": "0612345678",
    "teamSelected": "Real Madrid",
    "controllerPreference": "Manette personnelle PS5",
    "paymentProof": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "paymentProofName": "recu_virement_omar.png",
    "status": "confirmed",
    "registeredAt": "2026-11-03T17:03:57.285Z",
    "seed": 9,
    "whatsappInviteAttempts": 1,
    "whatsappInviteStatus": "sent",
    "whatsappInviteSentAt": "2026-11-04T13:02:19.568Z",
    "registrationNumber": "REG-2026-0015"
  },
  {
    "id": "reg_champ_hamza",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "usr_hamza",
    "gamertag": "Hamza_FCB",
    "playerName": "Hamza Chaoui",
    "userEmail": "hamza@fctournament.ma",
    "phone": "+212 6 33 44 55 66",
    "status": "confirmed",
    "registeredAt": "2026-02-07T14:30:00.000Z",
    "seed": 7,
    "registrationNumber": "REG-2026-0016"
  },
  {
    "id": "reg_champ_karim",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "usr_karim",
    "gamertag": "Karim_Atlas",
    "playerName": "Karim Benali",
    "userEmail": "karim.atlas@fctournament.ma",
    "phone": "+212 6 44 55 66 77",
    "status": "confirmed",
    "registeredAt": "2026-02-08T11:15:00.000Z",
    "seed": 8,
    "registrationNumber": "REG-2026-0017"
  },
  {
    "id": "reg_champ_tariq",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "usr_tariq",
    "gamertag": "Tariq_Pro9",
    "playerName": "Tariq Mansour",
    "userEmail": "tariq.mansour@fctournament.ma",
    "phone": "+212 6 55 66 77 88",
    "status": "confirmed",
    "registeredAt": "2026-02-09T16:20:00.000Z",
    "seed": 10,
    "registrationNumber": "REG-2026-0018"
  },
  {
    "id": "reg_champ_soufiane",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "usr_soufiane",
    "gamertag": "Souf_Skiller",
    "playerName": "Soufiane El Fassi",
    "userEmail": "soufiane.elfassi@fctournament.ma",
    "phone": "+212 6 66 77 88 99",
    "status": "confirmed",
    "registeredAt": "2026-02-10T18:45:00.000Z",
    "seed": 11,
    "registrationNumber": "REG-2026-0019"
  },
  {
    "id": "reg_champ_ayoub",
    "tournamentId": "tourn_spring_2026",
    "tournamentName": "Championnat",
    "userId": "usr_ayoub",
    "gamertag": "Ayoub_Striker",
    "playerName": "Ayoub Bennis",
    "userEmail": "ayoub.bennis@fctournament.ma",
    "phone": "+212 6 77 88 99 00",
    "status": "confirmed",
    "registeredAt": "2026-02-11T19:10:00.000Z",
    "seed": 12,
    "registrationNumber": "REG-2026-0020"
  }
];
