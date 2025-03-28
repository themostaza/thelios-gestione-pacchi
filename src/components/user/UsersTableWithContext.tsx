'use client'

import { useUser } from '@/context/userContext'

export default function UsersTableWithContext() {
  const { users, loading, error, deleteUser } = useUser()

  if (loading) return <div className='text-center py-4'>Caricamento in corso...</div>

  if (error) return <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>{error}</div>

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full bg-white border border-gray-300'>
        <thead>
          <tr className='bg-gray-100'>
            <th className='py-2 px-4 border-b'>Email</th>
            <th className='py-2 px-4 border-b'>Data creazione</th>
            <th className='py-2 px-4 border-b'>Stato</th>
            <th className='py-2 px-4 border-b'>Admin</th>
            <th className='py-2 px-4 border-b'>Azioni</th>
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
                    <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>Registrato</span>
                  ) : (
                    <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs'>Non registrato</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b'>
                  {user.is_admin ? (
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>Sì</span>
                  ) : (
                    <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs'>No</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b'>
                  <button
                    onClick={() => deleteUser(user.id, user.user_id)}
                    className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm'
                  >
                    Elimina
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
                Nessun utente trovato
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
