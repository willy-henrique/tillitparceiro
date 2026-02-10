import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export interface PartnerPixData {
  partnerId: string;
  partnerName: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  accountHolder: string;
  updatedAt: string;
}

const COLLECTION = 'partners';

function maskPixKey(key: string, type: PixKeyType): string {
  const clean = key.replace(/\D/g, '');
  switch (type) {
    case 'CPF':
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    case 'CNPJ':
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5');
    case 'PHONE':
      return clean.length >= 10 ? `(**) *****-${clean.slice(-4)}` : '****';
    case 'EMAIL':
      const [local, domain] = key.split('@');
      return local ? `${local.slice(0, 2)}***@${domain}` : '***';
    default:
      return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}

export async function getPartnerPix(partnerId: string): Promise<PartnerPixData | null> {
  const ref = doc(db, COLLECTION, partnerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : '';
  return {
    partnerId,
    partnerName: String(d.partnerName ?? ''),
    pixKeyType: (d.pixKeyType as PixKeyType) ?? 'CPF',
    pixKey: String(d.pixKey ?? ''),
    accountHolder: String(d.accountHolder ?? ''),
    updatedAt,
  };
}

export async function savePartnerPix(data: {
  partnerId: string;
  partnerName: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  accountHolder: string;
}): Promise<void> {
  const ref = doc(db, COLLECTION, data.partnerId);
  const normalizedKey = ['CPF', 'CNPJ', 'PHONE'].includes(data.pixKeyType)
    ? data.pixKey.replace(/\D/g, '')
    : data.pixKey.trim();
  await setDoc(ref, {
    partnerId: data.partnerId,
    partnerName: data.partnerName,
    pixKeyType: data.pixKeyType,
    pixKey: normalizedKey,
    accountHolder: data.accountHolder.trim(),
    updatedAt: Timestamp.now(),
  });
}

export async function getPartnersPix(partnerIds: string[]): Promise<Map<string, PartnerPixData>> {
  const map = new Map<string, PartnerPixData>();
  await Promise.all(
    partnerIds.map(async (id) => {
      const pix = await getPartnerPix(id);
      if (pix) map.set(id, pix);
    })
  );
  return map;
}

export function formatPixKeyDisplay(pix: PartnerPixData, mask = false): string {
  if (mask) return maskPixKey(pix.pixKey, pix.pixKeyType);
  switch (pix.pixKeyType) {
    case 'CPF':
      return pix.pixKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'CNPJ':
      return pix.pixKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'PHONE':
      return pix.pixKey.length >= 10
        ? `(${pix.pixKey.slice(0, 2)}) ${pix.pixKey.slice(2, 7)}-${pix.pixKey.slice(7)}`
        : pix.pixKey;
    default:
      return pix.pixKey;
  }
}
