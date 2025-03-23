import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card } from '@/lib/supabase'
import SearchFilters from '@/components/search/SearchFilters'
import CardGrid from '@/components/search/CardGrid'

interface SearchPageProps {
  searchParams: {
    query?: string
    year?: string
    set?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = createServerComponentClient({ cookies })

  // Build the query based on search parameters
  let query = supabase.from('cards').select('*')

  if (searchParams.query) {
    query = query.ilike('name', `%${searchParams.query}%`)
  }
  if (searchParams.year) {
    query = query.eq('year', parseInt(searchParams.year))
  }
  if (searchParams.set) {
    query = query.eq('set', searchParams.set)
  }
  if (searchParams.condition) {
    query = query.eq('condition', searchParams.condition)
  }

  // Execute the query
  const { data: cards, error } = await query

  if (error) {
    console.error('Error fetching cards:', error)
    return <div>Error loading cards. Please try again later.</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Search Cards</h1>
        <SearchFilters />
      </div>
      <CardGrid 
        cards={cards || []} 
        minPrice={searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined}
        maxPrice={searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined}
      />
    </div>
  )
} 