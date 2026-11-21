// Partenaires affiches en bas du site. Pour en ajouter un : nouvelle entree + logo dans public/assets/partenaires/
export interface Partner {
  name: string;
  fullName: string;
  role: string;
  logo: string;
  instagram?: string;
  link?: string;
}

export const PARTNERS: Partner[] = [
  {
    name: 'CETASSO',
    fullName: 'Cercle des Étudiants Africains du Sud Sahara à l’Oriental',
    role: 'Partenaire officiel',
    logo: '/assets/partenaires/cetasso.jpg',
    instagram: 'cetasso_officiel',
  },
];
