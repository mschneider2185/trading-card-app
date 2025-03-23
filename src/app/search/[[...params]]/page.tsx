import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import CardGrid from '../../../components/search/CardGrid'
import SearchFilters from '../../../components/search/SearchFilters'

type SearchParams = {
  card?: string
  player?: string
  year?: string
  set?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
}

type Props = {
  searchParams: SearchParams
  params: { params?: string[] }
}

export default async function SearchPage({ searchParams, params }: Props) {
  const supabase = createServerComponentClient({ cookies })
  
  // Build query based on search parameters
  let query = supabase.from('cards').select('*')
  
  if (searchParams.card) {
    query = query.eq('id', searchParams.card)
  }
  if (searchParams.player) {
    query = query.ilike('name', `%${searchParams.player}%`)
  }
  if (searchParams.year) {
    query = query.eq('year', searchParams.year)
  }
  if (searchParams.set) {
    query = query.ilike('set', `%${searchParams.set}%`)
  }
  if (searchParams.condition) {
    query = query.eq('condition', searchParams.condition)
  }
  if (searchParams.minPrice) {
    query = query.gte('price', parseFloat(searchParams.minPrice))
  }
  if (searchParams.maxPrice) {
    query = query.lte('price', parseFloat(searchParams.maxPrice))
  }

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