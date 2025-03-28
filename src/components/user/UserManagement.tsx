'use client'

import { UserProvider } from '@/context/userContext'

import CreateUserFormWithContext from './CreateUserFormWithContext'
import UsersTableWithContext from './UsersTableWithContext'

export default function UserManagement() {
  return (
    <UserProvider>
      <div className='space-y-8'>
        <div>
          <h1 className='text-xl font-bold mb-4'>Crea un nuovo utente</h1>
          <CreateUserFormWithContext />
        </div>

        <div>
          <h2 className='text-lg font-semibold mb-3'>Gestione utenti</h2>
          <UsersTableWithContext />
        </div>
      </div>
    </UserProvider>
  )
}
