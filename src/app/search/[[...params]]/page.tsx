import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import CardGrid from '../../../components/search/CardGrid'
import SearchFilters from '../../../components/search/SearchFilters'

export default async function SearchPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Build query based on search parameters
  const query = supabase.from('cards').select('*')

  const { data: cards, error } = await query

  if (error) {
    console.error('Error fetching cards:', error)
    return <div>Error loading cards</div>
  }

  return (
    <div className="space-y-8">
      <SearchFilters />
      <CardGrid cards={cards || []} />
    </div>
  )
} 