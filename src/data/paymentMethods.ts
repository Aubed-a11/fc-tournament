import type { PaymentMethodId } from '../types/index.ts';

// Coordonnees officielles de paiement (une seule source pour tout le site)
export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  badge: string;
  subtitle: string;
  beneficiary: string;
  fieldLabel: string;
  displayValue: string;
  copyValue: string;
  copyLabel: string;
  badgeClass: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'cih',
    label: 'CIH BANK',
    badge: 'CIH',
    subtitle: 'Virement bancaire (Maroc)',
    beneficiary: 'ALIO LABBO',
    fieldLabel: 'RIB',
    displayValue: '6046878211016200',
    copyValue: '6046878211016200',
    copyLabel: 'Copier le RIB',
    badgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  },
  {
    id: 'bmce',
    label: 'BMCE BANK (Bank of Africa)',
    badge: 'BMCE',
    subtitle: 'Virement bancaire (Maroc)',
    beneficiary: 'DAMBADE GISLAIN',
    fieldLabel: 'RIB',
    displayValue: '011570000007200000447220',
    copyValue: '011570000007200000447220',
    copyLabel: 'Copier le RIB',
    badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  },
  {
    id: 'mtn_momo',
    label: 'MTN MOMO',
    badge: 'MTN',
    subtitle: 'Mobile Money (Bénin)',
    beneficiary: 'ADJAKPA Brice',
    fieldLabel: 'Numéro MoMo',
    displayValue: '+229 0162403071',
    copyValue: '+2290162403071',
    copyLabel: 'Copier le numéro',
    badgeClass: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  },
];

export const paymentMethodLabel = (id?: string): string =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label || '';

// Copie dans le presse-papiers, avec repli pour les navigateurs mobiles anciens
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

// Reduit une image (capture d'ecran) avant l'envoi : version complete et miniature
export async function prepareImage(file: File): Promise<{ full: string; thumb: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image illisible. Essayez une capture au format JPG ou PNG.'));
    el.src = dataUrl;
  });
  const render = (maxSide: number, quality: number): string => {
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  };
  return { full: render(1600, 0.85), thumb: render(240, 0.6) };
}
