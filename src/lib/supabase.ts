import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase instance with service role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Types for our database tables
export type Profile = {
  id: string
  username: string
  updated_at: string
  avatar_url?: string
}

export type Card = {
  id: string
  name: string
  year: number
  set: string
  condition: string
  price: number
  image_url: string
  created_at: string
}

export type Collection = {
  id: string
  user_id: string
  card_id: string
  condition: string
  added_at: string
  card?: Card
} 