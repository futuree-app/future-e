import { createClient } from '@/lib/supabase/server';

export type SubscriptionStatus = 'anonymous' | 'free' | 'subscribed';

/**
 * Server-side subscription check — reads cookies per request.
 * Call only from Server Components or Route Handlers, never inside unstable_cache.
 *
 * 'anonymous' → not logged in
 * 'free'       → logged in, plan free or one_shot
 * 'subscribed' → active suivi or foyer plan
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return 'anonymous';

  const { data: account } = await supabase
    .from('user_accounts')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const plan = account?.plan ?? 'free';
  const status = account?.status ?? 'active';

  if ((plan === 'suivi' || plan === 'foyer') && status === 'active') {
    return 'subscribed';
  }

  return 'free';
}

export function isFullAccess(status: SubscriptionStatus): boolean {
  return status === 'subscribed';
}
