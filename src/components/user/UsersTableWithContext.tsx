'use client'

import { useUser } from '@/context/userContext'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Trash } from "lucide-react"
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"

function UserStatusBadge({ registered }: { registered: boolean }) {
  return registered ? (
    <Badge variant="outline" className="bg-white hover:bg-white text-gray-800 border border-gray-200 font-medium">
      Registrato
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-yellow-100 hover:bg-yellow-100 text-yellow-800 font-medium">
      Non registrato
    </Badge>
  )
}

function AdminBadge({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? (
    <Badge variant="outline" className="bg-black hover:bg-black text-white font-medium">
      Sì
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-white hover:bg-white text-gray-800 border border-gray-200 font-medium">
      No
    </Badge>
  )
}

export default function UsersTableWithContext() {
  const { users, loading, error, deleteUser } = useUser()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, userId: string | null) => {
    setDeletingId(id)
    await deleteUser(id, userId)
    setDeletingId(null)
  }

  if (loading) return (
    <div className='flex justify-center py-4'>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )

  if (error) return (
    <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md'>
      {error}
    </div>
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Creation Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          [...users].reverse().map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString('it-IT')}</TableCell>
              <TableCell>
                <UserStatusBadge registered={!!user.user_id} />
              </TableCell>
              <TableCell>
                <AdminBadge isAdmin={user.is_admin} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => handleDelete(user.id, user.user_id)}
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === user.id}
                >
                  {deletingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4 mr-1" />
                  )}
                  <span>Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
