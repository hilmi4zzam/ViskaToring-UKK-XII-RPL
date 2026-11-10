import { supabase } from './client';
import { Company, User } from './types';

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
 * 1. Jika first_login bernilai true
 * 2. ATAU jika penugasan company belum diset (company_id atau company masih kosong)
 */
export function isFirstLogin(user: User | null): boolean {
  if (!user) return false;
  if (user.first_login === true) return true;
  if (!user.company_id && !user.company) return true;
  return false;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const current = getStoredUser();
  if (!current?.id) return null;

  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('id, username, company_id, company, role, first_login, companies(*)')
      .eq('id', current.id)
      .maybeSingle();

    if (error || !data) {
      return current;
    }

    const updatedUser: User = {
      id: data.id,
      username: data.username,
      company_id: data.company_id ?? null,
      company: data.company ?? null,
      role: data.role || 'siswa',
      first_login: data.first_login ?? false,
      companies: (Array.isArray(data.companies) ? data.companies[0] : data.companies) as Company | null,
    };
    setStoredUser(updatedUser);
    return updatedUser;
  } catch (err) {
    console.error('Failed to sync current user:', err);
    return current;
  }
}
