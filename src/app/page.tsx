import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card } from '@/lib/supabase'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch some featured cards
  const { data: featuredCards } = await supabase
    .from('cards')
    .select('*')
    .limit(6)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Find and Track Your Trading Cards
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Search through thousands of sports and collectible trading cards. Track prices, manage your collection, and more.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/search"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Search Cards
          </Link>
          <Link href="/collections" className="text-sm font-semibold leading-6 text-gray-900">
            View Collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Featured Cards Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Cards</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {featuredCards?.map((card: Card) => (
            <div key={card.id} className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link href={`/search?card=${card.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {card.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{card.year} {card.set}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${card.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
