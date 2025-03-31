'use client'

import GenericCardView from '@/components/GenericCardView'
import AccountForm from '@/components/user/accountForm'
import AccountsTable from '@/components/user/accountsTable'
import { UserProvider } from '@/context/userContext'

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
            <AccountForm />
          </div>

          {/* Users table on the right */}
          <div className='w-full md:w-2/3 overflow-auto'>
            <h3 className='text-lg font-semibold mb-4'>Utenti</h3>
            <AccountsTable />
          </div>
        </div>
      </GenericCardView>
    </UserProvider>
  )
}
