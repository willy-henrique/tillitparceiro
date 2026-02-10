import { compare } from 'bcryptjs';

const ADMIN_EMAIL = 'tillitparceiro@gmail.com';
const ADMIN_PASSWORD_HASH = '$2a$10$Eqi06aS2o.ZGzQs9JNqC6.aXcOyx/Vnb/nEsJSK1q1WB0I1ahhExW';

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) return false;
  return compare(password, ADMIN_PASSWORD_HASH);
}
