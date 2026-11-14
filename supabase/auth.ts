import { supabase } from './client';
import { Company, User, UserRole, UserAccountStatus } from './types';

const STORAGE_KEY = 'viskatoring_user_session';

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Cek apakah user perlu melalui tahap Onboarding / Konfigurasi:
 * - Siswa: Harus konfigurasi jika first_login bernilai true ATAU belum memilih tempat magang (DUDI).
 * - Admin & Guru: Bukan peserta magang, sehingga TIDAK PERNAH diwajibkan memilih company.
 *   Mereka hanya masuk konfigurasi jika first_login = true (misal untuk ganti password awal).
 */
export function isFirstLogin(user: User | null): boolean {
  if (!user) return false;

  if (user.role === 'siswa') {
    if (user.first_login === true) return true;
    if (!user.company_id) return true;
    return false;
  }

  // Admin dan Guru
  return user.first_login === true;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const current = getStoredUser();
  if (!current?.id) return null;

  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('id, username, company_id, role, status, first_login, pending_company_id, pending_company_status, companies:company_id(*)')
      .eq('id', current.id)
      .maybeSingle();

    if (error || !data) {
      return current;
    }

    const updatedUser: User = {
      id: data.id,
      username: data.username,
      company_id: data.company_id ?? null,
      role: (['admin', 'guru', 'siswa'].includes(data.role) ? data.role : 'siswa') as UserRole,
      status: (['pending', 'approved', 'rejected'].includes(data.status) ? data.status : 'approved') as UserAccountStatus,
      first_login: data.first_login ?? false,
      pending_company_id: data.pending_company_id ?? null,
      pending_company_status: data.pending_company_status ?? null,
      companies: (Array.isArray(data.companies) ? data.companies[0] : data.companies) as Company | null,
    };
    setStoredUser(updatedUser);
    return updatedUser;
  } catch (err) {
    console.error('Failed to sync current user:', err);
    return current;
  }
}
