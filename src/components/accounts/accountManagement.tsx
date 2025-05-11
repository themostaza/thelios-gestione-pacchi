'use client'

import GenericCardView from '@/components/genericCardView'
import AccountForm from '@/components/accounts/form'
import AccountsTable from '@/components/accounts/accountsTable'
import { UserProvider } from '@/context/userContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function UserManagement() {
  const { t } = useTranslation()

  return (
    <UserProvider>
      <GenericCardView
        title={t('user.management')}
        description={t('user.description')}
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
