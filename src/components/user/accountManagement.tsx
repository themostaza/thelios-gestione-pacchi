'use client'

import GenericCardView from '@/components/GenericCardView'
import AccountForm from '@/components/user/accountForm'
import AccountsTable from '@/components/user/accountsTable'
import { UserProvider } from '@/context/userContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function UserManagement() {
  const { t } = useTranslation()

  return (
    <UserProvider>
      <GenericCardView
        title='Gestione Utenti'
        description='Crea e gestisci gli utenti del sistema'
        useScrollArea={false}
      >
        <div className='flex flex-col lg:flex-row gap-6 h-full'>
          {/* Form on the left for md screens and up */}
          <div className='w-full lg:w-1/3 bg-card border rounded-lg p-6 shadow-sm'>
            <h3 className='text-lg font-semibold mb-4'>{t('user.newUser')}</h3>
            <AccountForm />
          </div>

          {/* Users table on the right */}
          <div className='w-full lg:w-2/3 overflow-auto'>
            <h3 className='text-lg font-semibold mb-4'>{t('user.users')}</h3>
            <AccountsTable />
          </div>
        </div>
      </GenericCardView>
    </UserProvider>
  )
}
