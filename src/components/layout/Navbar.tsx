'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-700 hover:text-indigo-800">
                Card Trader
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-indigo-500 text-indigo-900'
                    : 'border-transparent text-gray-600 hover:text-indigo-700 hover:border-indigo-300'
                }`}
              >
                Home
              </Link>
              <Link
                href="/search"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/search')
                    ? 'border-indigo-500 text-indigo-900'
                    : 'border-transparent text-gray-600 hover:text-indigo-700 hover:border-indigo-300'
                }`}
              >
                Search
              </Link>
              <Link
                href="/collections"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/collections')
                    ? 'border-indigo-500 text-indigo-900'
                    : 'border-transparent text-gray-600 hover:text-indigo-700 hover:border-indigo-300'
                }`}
              >
                Collection
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/profile')
                    ? 'border-indigo-500 text-indigo-900'
                    : 'border-transparent text-gray-600 hover:text-indigo-700 hover:border-indigo-300'
                }`}
              >
                Profile
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                : 'border-transparent text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            Home
          </Link>
          <Link
            href="/search"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/search')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                : 'border-transparent text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            Search
          </Link>
          <Link
            href="/collections"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/collections')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                : 'border-transparent text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            Collection
          </Link>
          <Link
            href="/profile"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/profile')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                : 'border-transparent text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
} 