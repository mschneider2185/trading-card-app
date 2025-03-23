'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

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
  price?: number
}

interface CardGridProps {
  cards: Card[]
}

export default function CardGrid({ cards }: CardGridProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [addingCardId, setAddingCardId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAddToCollection = async (cardId: string) => {
    try {
      setAddingCardId(cardId)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('collection_items').insert({
        user_id: user.id,
        card_id: cardId,
        quantity: 1,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Card added to collection' })
    } catch (error) {
      console.error('Error adding card to collection:', error)
      setMessage({ type: 'error', text: 'Failed to add card to collection' })
    } finally {
      setAddingCardId(null)
    }
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="aspect-w-1 aspect-h-1">
              <img
                src={card.image_url || '/placeholder-card.jpg'}
                alt={card.player_name}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{card.player_name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {card.year} {card.brand} {card.set_name}
                {card.card_number && ` #${card.card_number}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {card.is_rookie && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Rookie
                  </span>
                )}
                {card.is_autographed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Autographed
                  </span>
                )}
                {card.is_patch && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Patch
                  </span>
                )}
                {card.serial_numbered && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    #{card.serial_number}
                  </span>
                )}
              </div>

              {card.price && (
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  ${card.price.toFixed(2)}
                </p>
              )}

              <button
                onClick={() => handleAddToCollection(card.id)}
                disabled={addingCardId === card.id}
                className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {addingCardId === card.id ? 'Adding...' : 'Add to Collection'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 