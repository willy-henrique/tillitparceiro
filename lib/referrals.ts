import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Referral } from '../types';
import { ReferralStatus } from '../types';

const COLLECTION = 'referrals';

function firestoreToReferral(data: Record<string, unknown>): Referral {
  const getString = (v: unknown) => (v != null ? String(v) : '');
  const getNum = (v: unknown) => (typeof v === 'number' ? v : 0);
  return {
    id: getString(data.id),
    partnerId: getString(data.partnerId),
    partnerName: getString(data.partnerName),
    companyName: getString(data.companyName),
    cnpj: getString(data.cnpj),
    contactName: getString(data.contactName),
    phone: getString(data.phone),
    email: getString(data.email),
    status: (data.status as ReferralStatus) ?? ReferralStatus.PENDENTE,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : getString(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : getString(data.updatedAt),
    implementationPaidAt: data.implementationPaidAt instanceof Timestamp
      ? data.implementationPaidAt.toDate().toISOString()
      : (data.implementationPaidAt ? String(data.implementationPaidAt) : undefined),
    bonusAmount: getNum(data.bonusAmount) || 150,
  };
}

export async function getReferrals(partnerId?: string): Promise<Referral[]> {
  const col = collection(db, COLLECTION);
  const q = partnerId
    ? query(col, where('partnerId', '==', partnerId), orderBy('createdAt', 'desc'))
    : query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = { ...d.data(), id: d.id };
    return firestoreToReferral(data);
  });
}

export async function addReferral(referral: Omit<Referral, 'id'>): Promise<Referral> {
  const col = collection(db, COLLECTION);
  const docData = {
    partnerId: referral.partnerId,
    partnerName: referral.partnerName,
    companyName: referral.companyName,
    cnpj: referral.cnpj,
    contactName: referral.contactName,
    phone: referral.phone,
    email: referral.email,
    status: referral.status,
    bonusAmount: referral.bonusAmount,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(col, docData);
  return { ...referral, id: ref.id };
}

export async function updateReferralStatus(
  id: string,
  status: ReferralStatus
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const updates: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (status === ReferralStatus.CONVERTIDA) {
    updates.implementationPaidAt = Timestamp.now();
  }
  await updateDoc(ref, updates);
}
