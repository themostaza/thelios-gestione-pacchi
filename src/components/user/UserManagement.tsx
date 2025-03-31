'use client'

import GenericCardView from '@/components/GenericCardView'
import { UserProvider } from '@/context/userContext'

import CreateUserFormWithContext from './CreateUserFormWithContext'
import UsersTableWithContext from './UsersTableWithContext'

export default function UserManagement() {
  return (
    <UserProvider>
      <GenericCardView
        title='Gestione Utenti'
        description='Crea e gestisci gli utenti del sistema'
        useScrollArea={false}
      >
        <div className='flex flex-col md:flex-row gap-6 h-full'>
          {/* Form on the left for md screens and up */}
          <div className='w-full md:w-1/3 bg-card border rounded-lg p-6 shadow-sm'>
            <h3 className='text-lg font-semibold mb-4'>Nuovo Utente</h3>
            <CreateUserFormWithContext />
          </div>

          {/* Users table on the right */}
          <div className='w-full md:w-2/3 overflow-auto'>
            <h3 className='text-lg font-semibold mb-4'>Utenti</h3>
            <UsersTableWithContext />
          </div>
        </div>
      </GenericCardView>
    </UserProvider>
  )
}
