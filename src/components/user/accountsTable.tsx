'use client'

import { Loader2, Trash } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/statusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUser } from '@/context/userContext'
import { useTranslation } from '@/i18n/I18nProvider'

function UserStatusBadge({ registered }: { registered: boolean }) {
  return (
    <StatusBadge
      status={registered ? 'registered' : 'not-registered'}
      variant='outline'
    />
  )
}

function AdminBadge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <StatusBadge
      status={isAdmin ? 'admin' : 'not-admin'}
      variant='outline'
    />
  )
}

export default function AccountsTable() {
  const { t } = useTranslation()
  const { users, loading, error, deleteUser } = useUser()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, userId: string | null) => {
    if (!confirm(t('common.confirmDelete'))) return

    setDeletingId(id)
    await deleteUser(id, userId)
    setDeletingId(null)
  }

  if (loading)
    return (
      <div className='flex justify-center py-4'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    )

  if (error) return <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md'>{error}</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          {/* <TableHead>Creation Date</TableHead> */}
          <TableHead>{t('user.status.registered')}</TableHead>
          <TableHead>{t('user.isAdmin')}</TableHead>
          <TableHead className='text-right'>{t('common.delete')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          [...users].reverse().map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              {/* <TableCell>{new Date(user.created_at).toLocaleDateString('it-IT')}</TableCell> */}
              <TableCell>
                <UserStatusBadge registered={!!user.user_id} />
              </TableCell>
              <TableCell>
                <AdminBadge isAdmin={user.is_admin} />
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  onClick={() => handleDelete(user.id, user.user_id)}
                  variant='destructive'
                  size='sm'
                  disabled={deletingId === user.id}
                >
                  {deletingId === user.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash className='h-4 w-4 mr-1' />}
                  <span>{t('common.delete')}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={5}
              className='text-center text-muted-foreground py-6'
            >
              {t('common.noUsersFound')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
