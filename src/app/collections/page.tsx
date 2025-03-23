import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import CollectionGrid from '@/components/collections/CollectionGrid'

export default async function CollectionsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Please sign in to view your collection
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Sign in to access your card collection and manage your cards.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { data: collections, error } = await supabase
    .from('collection_items')
    .select(`
      *,
      cards (
        id,
        sport,
        year,
        brand,
        set_name,
        player_name,
        card_number,
        variant,
        condition,
        is_rookie,
        is_autographed,
        is_patch,
        patch_description,
        auto_type,
        serial_numbered,
        serial_number,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection:', error)
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Error loading collection
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              There was an error loading your collection. Please try again later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              My Collection
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your card collection and track your inventory.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Cards
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cards in collection</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start building your collection by adding some cards.
            </p>
            <div className="mt-6">
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Cards
              </Link>
            </div>
          </div>
        ) : (
          <CollectionGrid collections={collections} />
        )}
      </div>
    </div>
  )
} 