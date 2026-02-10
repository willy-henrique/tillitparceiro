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

export interface PartnerRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  role: 'PARTNER';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

const COLLECTION = 'users';

export async function createPartnerRequestFromGoogle(data: {
  name: string;
  email: string;
  phone?: string;
}): Promise<PartnerRequest> {
  const col = collection(db, COLLECTION);
  const docData = {
    name: data.name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone ?? '',
    status: 'PENDING_APPROVAL',
    role: 'PARTNER',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(col, docData);
  return {
    id: ref.id,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone ?? '',
    status: 'PENDING_APPROVAL',
    role: 'PARTNER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function createPartnerRequest(data: {
  name: string;
  email: string;
  phone: string;
}): Promise<PartnerRequest> {
  const col = collection(db, COLLECTION);
  const docData = {
    name: data.name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone,
    status: 'PENDING_APPROVAL',
    role: 'PARTNER',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(col, docData);
  return {
    id: ref.id,
    ...data,
    email: data.email.toLowerCase().trim(),
    status: 'PENDING_APPROVAL',
    role: 'PARTNER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPendingPartners(): Promise<PartnerRequest[]> {
  const col = collection(db, COLLECTION);
  const q = query(
    col,
    where('status', '==', 'PENDING_APPROVAL'),
    where('role', '==', 'PARTNER'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '';
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : '';
    return {
      id: d.id,
      name: String(data.name ?? ''),
      email: String(data.email ?? ''),
      phone: String(data.phone ?? ''),
      status: (data.status as PartnerRequest['status']) ?? 'PENDING_APPROVAL',
      role: 'PARTNER' as const,
      createdAt,
      updatedAt,
    };
  });
}

export async function approvePartner(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'APPROVED',
    updatedAt: Timestamp.now(),
    approvedAt: Timestamp.now(),
  });
}

export async function rejectPartner(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'REJECTED',
    updatedAt: Timestamp.now(),
  });
}

export async function getUserByEmail(email: string): Promise<PartnerRequest | null> {
  const col = collection(db, COLLECTION);
  const q = query(col, where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '';
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : '';
  return {
    id: d.id,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    status: (data.status as PartnerRequest['status']) ?? 'PENDING_APPROVAL',
    role: 'PARTNER' as const,
    createdAt,
    updatedAt,
  };
}
