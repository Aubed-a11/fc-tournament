import type { Tournament, Match, PlayerLeaderboard, Registration } from "../types/index.ts";

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    "id": "tourn_spring_2026",
    "name": "Championnat sur téléphone",
    "slug": "championnat-sur-telephone",
    "description": "Le tournoi e-sport incontournable de la saison ! Rassemblez-vous pour célébrer la compétition et couronner le meilleur joueur dans une ambiance électrique devant vos écrans.",
    "gameVersion": "EA SPORTS 27",
    "platform": "Téléphone (Mobile)",
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
    "name": "Championnat sur PC",
    "slug": "championnat-sur-pc",
    "description": "La compétition d’élite qui réunit les meilleurs joueurs pour s’affronter et décrocher le titre de champion.",
    "gameVersion": "EA SPORTS 27",
    "platform": "PC",
    "format": "aller_retour",
    "location": "Gaming Arena",
    "city": "Maroc",
    "startDate": "2026-03-14",
    "time": "16:00",
    "registrationDeadline": "2026-03-12T18:00:00.000Z",
    "maxParticipants": 32,
    "entryFeeMAD": 50,
    "prizePool": "**** MAD + Trophée + T-shirt",
    "status": "completed",
    "rules": "Article 1 – Format des matchs : Les rencontres se disputent en mode « Coup d’envoi », avec une durée de 5 minutes par mi-temps.\nArticle 2 – Système de confrontation : Chaque compétiteur doit affronter son adversaire lors de deux rencontres : un match aller et un match retour.\nArticle 3 – Fair-play et comportement : Le fair-play est obligatoire durant toute la compétition. Tout comportement antisportif peut entraîner la disqualification immédiate.\nArticle 4 – Utilisation des manettes : Manettes fournies ou manette personnelle autorisée après vérification technique.\nArticle 5 – Transmission des résultats : Capture d’écran du score final obligatoire après chaque match.\nArticle 6 – Fraude et falsification : Toute falsification entraîne l’élimination immédiate.\nArticle 7 – Vérification technique : L’équipe technique vérifie l’authenticité des captures.\nArticle 8 – Retard et absence : Retard supérieur à 10 minutes = forfait automatique.",
    "bannerImage": "/assets/aistudio/a8122cd3-7ef9-44e0-b5a7-6cc0230fe1eb_a174390d.png",
    "createdAt": "2026-01-20T12:00:00.000Z",
    "participantsCount": 8,
    "confirmedCount": 8,
    "userRegistration": null
  }
];

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_LEADERBOARD: PlayerLeaderboard[] = [];

export const INITIAL_REGISTRATIONS: Registration[] = [];
