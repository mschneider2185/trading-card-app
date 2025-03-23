'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
    }
    
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
                className={`${
                  isActive('/') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                href="/search"
                className={`${
                  isActive('/search') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Search
              </Link>
              {session && (
                <>
                  <Link
                    href="/collections"
                    className={`${
                      isActive('/collections') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Collection
                  </Link>
                  <Link
                    href="/profile"
                    className={`${
                      isActive('/profile') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <button
                onClick={handleSignOut}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
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
          {session && (
            <>
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
            </>
          )}
          {session ? (
            <button
              onClick={handleSignOut}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
} 