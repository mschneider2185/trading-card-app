import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('Auth callback error:', authError)
        return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin))
      }

      if (session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!profile) {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: session.user.id,
              username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
              agreed_to_terms: true,
              agreed_to_terms_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])

          if (profileError) {
            console.error('Profile creation error:', profileError)
            return NextResponse.redirect(new URL('/login?error=profile', requestUrl.origin))
          }
        }
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/add-card', requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=unknown', request.url))
  }
} 