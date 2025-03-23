'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Card {
  id: string
  sport: string
  year: number
  brand: string
  set_name: string
  player_name: string
  card_number?: string
  variant?: string
  condition?: string
  is_rookie: boolean
  is_autographed: boolean
  is_patch: boolean
  patch_description?: string
  auto_type?: string
  serial_numbered: boolean
  serial_number?: string
  image_url?: string
}

interface CollectionItem {
  id: string
  user_id: string
  card_id: string
  quantity: number
  purchase_price?: number
  purchase_date?: string
  notes?: string
  for_sale: boolean
  asking_price?: number
  created_at: string
  updated_at: string
  cards: Card
}

interface CollectionGridProps {
  collections: CollectionItem[]
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  const supabase = createClientComponentClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdateQuantity = async (collectionId: string, newQuantity: number) => {
    try {
      setUpdatingId(collectionId)
      const { error } = await supabase
        .from('collection_items')
        .update({ quantity: newQuantity })
        .eq('id', collectionId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Card quantity updated successfully' })
    } catch (error) {
      console.error('Error updating card quantity:', error)
      setMessage({ type: 'error', text: 'Failed to update card quantity' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveCard = async (collectionId: string) => {
    if (!confirm('Are you sure you want to remove this card from your collection?')) {
      return
    }

    try {
      setUpdatingId(collectionId)
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('id', collectionId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Card removed from collection' })
    } catch (error) {
      console.error('Error removing card:', error)
      setMessage({ type: 'error', text: 'Failed to remove card from collection' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="aspect-w-1 aspect-h-1">
              <img
                src={collection.cards.image_url || '/placeholder-card.jpg'}
                alt={collection.cards.player_name}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{collection.cards.player_name}</h3>
              <p className="text-sm text-gray-700 mt-1">
                {collection.cards.year} {collection.cards.brand} {collection.cards.set_name}
                {collection.cards.card_number && ` #${collection.cards.card_number}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {collection.cards.is_rookie && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                    Rookie
                  </span>
                )}
                {collection.cards.is_autographed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-900">
                    Autographed
                  </span>
                )}
                {collection.cards.is_patch && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-900">
                    Patch
                  </span>
                )}
                {collection.cards.serial_numbered && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-900">
                    #{collection.cards.serial_number}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={`quantity-${collection.id}`} className="text-sm font-medium text-gray-900">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    id={`quantity-${collection.id}`}
                    min="1"
                    value={collection.quantity}
                    onChange={(e) => handleUpdateQuantity(collection.id, parseInt(e.target.value))}
                    disabled={updatingId === collection.id}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <button
                  onClick={() => handleRemoveCard(collection.id)}
                  disabled={updatingId === collection.id}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {updatingId === collection.id ? 'Updating...' : 'Remove from Collection'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 