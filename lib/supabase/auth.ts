import { createClient } from './server'

export interface AuthenticatedUser {
  id: string
  email?: string
}

/** Returns only a server-confirmed identity. Auth/config failures fail closed. */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email }
  } catch {
    return null
  }
}
