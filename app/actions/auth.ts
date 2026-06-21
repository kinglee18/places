'use server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ success: true } | { error: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
      return { error: 'email_exists' };
    }
    return { error: 'unknown' };
  }

  return { success: true };
}
