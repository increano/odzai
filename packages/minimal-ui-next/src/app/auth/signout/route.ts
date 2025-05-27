import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()

  // Check if we have a logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('Error checking user session:', userError)
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
  }

  if (user) {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error during sign out:', error)
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    }
  }

  // Revalidate all pages that might show user state
  revalidatePath('/', 'layout')
  
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
} 