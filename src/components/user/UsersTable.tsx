'use client'

import { useState, useEffect } from 'react'

import { getAllProfiles, deleteProfileUser } from '@/app/actions/userActions'

type ProfileUser = {
  id: string
  email: string
  created_at: string
  user_id: string | null
  is_admin: boolean
}

export default function UsersTable() {
  const [users, setUsers] = useState<ProfileUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const result = await getAllProfiles()
      if (result.success && result.users) {
        setUsers(result.users as unknown as ProfileUser[])
        setError(null)
      } else {
        setError(result.message || 'Error loading users')
        setUsers([])
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error'
      setError('Unexpected error: ' + errorMessage)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, userId: string | null) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await deleteProfileUser(id, userId)
        if (result.success) {
          // Aggiorna la lista dopo l'eliminazione
          loadUsers()
        } else {
          alert(result.message)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unexpected error'
        alert('Error during deletion: ' + errorMessage)
      }
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  if (loading) return <div className='text-center py-4'>Loading...</div>

  if (error) return <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>{error}</div>

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full bg-white border border-gray-300'>
        <thead>
          <tr className='bg-gray-100'>
            <th className='py-2 px-4 border-b'>Email</th>
            <th className='py-2 px-4 border-b'>Creation date</th>
            <th className='py-2 px-4 border-b'>Status</th>
            <th className='py-2 px-4 border-b'>Admin</th>
            <th className='py-2 px-4 border-b'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr
                key={user.id}
                className='hover:bg-gray-50'
              >
                <td className='py-2 px-4 border-b'>{user.email}</td>
                <td className='py-2 px-4 border-b'>{new Date(user.created_at).toLocaleDateString('it-IT')}</td>
                <td className='py-2 px-4 border-b'>
                  {user.user_id ? (
                    <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>Registered</span>
                  ) : (
                    <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs'>Not registered</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b'>
                  {user.is_admin ? (
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>Yes</span>
                  ) : (
                    <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs'>No</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b'>
                  <button
                    onClick={() => handleDelete(user.id, user.user_id)}
                    className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className='py-4 text-center text-gray-500'
              >
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
