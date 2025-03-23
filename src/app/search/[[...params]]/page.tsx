import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import CardGrid from '../../../components/search/CardGrid'
import SearchFilters from '../../../components/search/SearchFilters'

type SearchPageProps = {
  params: { params: string[] }
  searchParams: Record<string, string | string[] | undefined>
}

export default async function SearchPage(props: SearchPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  // Build query based on search parameters
  let query = supabase.from('cards').select('*')
  
  // Handle search from URL params or searchParams
  const searchQuery = props.params.params[0] || props.searchParams?.q
  
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`)
  }
  
  if (props.searchParams?.year) {
    query = query.eq('year', props.searchParams.year)
  }
  if (props.searchParams?.set) {
    query = query.ilike('set', `%${props.searchParams.set}%`)
  }
  if (props.searchParams?.condition) {
    query = query.eq('condition', props.searchParams.condition)
  }
  if (props.searchParams?.minPrice) {
    query = query.gte('price', parseFloat(props.searchParams.minPrice as string))
  }
  if (props.searchParams?.maxPrice) {
    query = query.lte('price', parseFloat(props.searchParams.maxPrice as string))
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