'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [set, setSet] = useState(searchParams.get('set') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (year) params.set('year', year)
    if (set) params.set('set', set)
    if (condition) params.set('condition', condition)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.push(`/search${newUrl}`)
  }, [query, year, set, condition, minPrice, maxPrice, router])

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-900">
            Search
          </label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by player or set name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-900">
            Year
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Enter year"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="set" className="block text-sm font-medium text-gray-900">
            Set
          </label>
          <input
            type="text"
            id="set"
            value={set}
            onChange={(e) => setSet(e.target.value)}
            placeholder="Enter set name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-900">
            Condition
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
          >
            <option value="">All Conditions</option>
            <option value="mint">Mint</option>
            <option value="near_mint">Near Mint</option>
            <option value="excellent">Excellent</option>
            <option value="very_good">Very Good</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-900">
            Min Price
          </label>
          <input
            type="number"
            id="minPrice"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Enter minimum price"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-900">
            Max Price
          </label>
          <input
            type="number"
            id="maxPrice"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Enter maximum price"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  )
} 