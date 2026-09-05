import type { ReactNode } from 'react'
import { AccountRequired } from '@/app/profile/AccountRequired'
import { getAuthenticatedUser } from '@/lib/supabase/auth'

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user) return <AccountRequired />
  return children
}
