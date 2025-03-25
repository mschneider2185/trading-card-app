'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'


interface Profile {
  id: string
  username: string
  avatar_url?: string
  updated_at: string
}

interface ProfileFormProps {
  user: User
  profile: Profile | null
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // First try to get the existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error fetching profile:', fetchError)
          throw fetchError
        }

        if (existingProfile?.username) {
          setUsername(existingProfile.username)
          if (existingProfile.avatar_url) {
            setAvatarUrl(existingProfile.avatar_url)
          }
        } else {
          // Create a default username from email or user ID
          const defaultUsername = user.email 
            ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
            : `user_${user.id.slice(0, 8)}`

          // Create initial profile with default username
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: defaultUsername,
              updated_at: new Date().toISOString(),
            })

          if (createError) {
            console.error('Error creating initial profile:', createError)
            throw createError
          }

          setUsername(defaultUsername)
        }
      } catch (error) {
        console.error('Profile initialization error:', error)
        setMessage({
          type: 'error',
          text: 'Failed to initialize profile. Please try refreshing the page.'
        })
      }
    }

    if (user) {
      initializeProfile()
    }
  }, [user, supabase])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true)
      setMessage(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      if (!username) {
        throw new Error('Username is not initialized. Please try refreshing the page.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}`
      const filePath = `${fileName}.${fileExt}`

      console.log('Starting upload process:', { fileName, fileExt, filePath })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      console.log('Upload successful:', uploadData)

      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      console.log('Got public URL:', urlData.publicUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      setAvatarUrl(urlData.publicUrl)
      setMessage({ type: 'success', text: 'Profile picture updated successfully' })
    } catch (error) {
      console.error('Profile picture update error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile picture'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!username) {
      setMessage({ type: 'error', text: 'Username is required' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return

    try {
      setLoading(true)
      setMessage(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // Call the delete-user Edge Function
      const response = await fetch('https://xwtgmtlztkeapsdtbglc.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete account')
      }

      // Sign out after successful deletion
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Delete account error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete account'
      })
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
          <div className="mt-2 flex items-center space-x-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <svg
                  className="h-full w-full text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {loading ? 'Uploading...' : 'Change'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-600 bg-gray-50"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Delete Account Section */}
        <div className="pt-8 border-t border-gray-200">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Danger Zone</h3>
            <p className="mt-1 text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
      </form>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Account</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete your account? This action cannot be undone.
                      All your data will be permanently removed. This includes your profile, collections,
                      and all associated information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <div className="flex items-center mb-4">
                  <input
                    id="confirm-delete"
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirm-delete" className="ml-2 block text-sm text-gray-900">
                    I understand that this action is irreversible
                  </label>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    disabled={!confirmDelete || loading}
                    onClick={handleDeleteAccount}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setConfirmDelete(false)
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message display */}
      {message && (
        <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
    </div>
  )
} 
