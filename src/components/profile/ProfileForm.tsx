'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'


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
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
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

  return (
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
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
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
    </form>
  )
} 
