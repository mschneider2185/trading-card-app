import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Get the request body
    const { userId } = await req.json()
    if (!userId) {
      throw new Error('userId is required')
    }

    console.log('Received request to delete user:', userId)

    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
      throw new Error('Server configuration error')
    }

    console.log('Creating Supabase admin client')
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Delete user's collection items
    console.log('Deleting collection items...')
    const { error: deleteCollectionError } = await supabaseAdmin
      .from('collection_items')
      .delete()
      .eq('user_id', userId)

    if (deleteCollectionError) {
      console.error('Failed to delete collection items:', deleteCollectionError)
      throw new Error(`Failed to delete collection items: ${deleteCollectionError.message}`)
    }

    // Delete user's profile
    console.log('Deleting user profile...')
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.error('Failed to delete profile:', deleteProfileError)
      throw new Error(`Failed to delete profile: ${deleteProfileError.message}`)
    }

    // Delete user from auth.users
    console.log('Deleting user from auth.users...')
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Failed to delete user:', deleteUserError)
      throw new Error(`Failed to delete user: ${deleteUserError.message}`)
    }

    console.log('Successfully deleted user and all associated data')

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 