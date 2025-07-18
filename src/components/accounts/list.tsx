'use client'

import { Loader2, Trash, Key } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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

function StatusBadgeComponent({ status }: { status: 'pending' | 'approved' | 'rejected' | 'registered' | 'reset_password' }) {
  return (
    <StatusBadge
      status={status === 'reset_password' ? 'reset-password' : status}
      variant='outline'
    />
  )
}

export default function AccountsTable() {
  const { t } = useTranslation()
  const { users, loading, error, deleteUser, resetPassword } = useUser()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; userId: string | null } | null>(null)

  const openDeleteDialog = (id: string, userId: string | null) => {
    setSelectedUser({ id, userId })
    setDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!selectedUser) return
    setDeletingId(selectedUser.id)
    setDialogOpen(false)
    await deleteUser(selectedUser.id, selectedUser.userId)
    setDeletingId(null)
    setSelectedUser(null)
  }

  const handleResetPassword = async (id: string) => {
    setResettingId(id)
    await resetPassword(id)
    setResettingId(null)
  }

  if (loading)
    return (
      <div className='flex justify-center py-4'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    )

  if (error) return <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md'>{error}</div>

  return (
    <>
      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDeleteTitle') || t('common.delete')}</DialogTitle>
            <DialogDescription>{t('common.confirmDelete')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteConfirmed}
              disabled={deletingId === selectedUser?.id}
            >
              {deletingId === selectedUser?.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash className='h-4 w-4 mr-1' />}
              <span>{t('common.delete')}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>{t('user.status.status')}</TableHead>
            <TableHead>{t('user.status.registered')}</TableHead>
            <TableHead>{t('user.isAdmin')}</TableHead>
            <TableHead className='text-right'>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            [...users].reverse().map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <StatusBadgeComponent status={user.status} />
                </TableCell>
                <TableCell>
                  <UserStatusBadge registered={!!user.user_id} />
                </TableCell>
                <TableCell>
                  <AdminBadge isAdmin={user.is_admin} />
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      onClick={() => handleResetPassword(user.id)}
                      variant='outline'
                      size='sm'
                      disabled={resettingId === user.id || user.status === 'reset_password'}
                    >
                      {resettingId === user.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Key className='h-4 w-4 mr-1' />}
                      <span>{t('user.resetPassword')}</span>
                    </Button>
                    <Button
                      onClick={() => openDeleteDialog(user.id, user.user_id)}
                      variant='destructive'
                      size='sm'
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash className='h-4 w-4 mr-1' />}
                      <span>{t('common.delete')}</span>
                    </Button>
                  </div>
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
    </>
  )
}
