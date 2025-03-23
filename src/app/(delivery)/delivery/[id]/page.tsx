'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Mail, ArrowLeft, List, Check, MoreVertical, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getDeliveryById, updateDeliveryStatus, sendReminderEmail, getDeliveryReminders } from '@/app/actions/deliveryActions'
import { DeliveryData, ReminderLog } from '@/app/actions/deliveryActions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DeliveryDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusToChange, setStatusToChange] = useState<string | null>(null)
  const [emailLogs, setEmailLogs] = useState<ReminderLog[]>([])
  const [sendingReminder, setSendingReminder] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

  useEffect(() => {
    async function loadDelivery() {
      setLoading(true)
      try {
        const result = await getDeliveryById(id)
        if (result.success) {
          setDelivery(result.data)
          
          // Load email reminders history
          const remindersResult = await getDeliveryReminders(id)
          if (remindersResult.success) {
            setEmailLogs(remindersResult.data || [])
          }
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError('Failed to load delivery details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadDelivery()
  }, [id])

  async function handleStatusChange(newStatus: string) {
    try {
      const result = await updateDeliveryStatus(id, newStatus);
      if (result.success) {
        setDelivery(prev => prev ? {...prev, status: newStatus} : null);
        setDialogOpen(false);
      } else {
        setError(result.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating the status');
    }
  }

  function openStatusChangeDialog(status: string) {
    setStatusToChange(status);
    setDialogOpen(true);
  }

  async function handleSendReminder() {
    if (!delivery) return;
    
    setSendingReminder(true);
    try {
      const result = await sendReminderEmail(id, delivery.recipientEmail);
      
      if (result.success && result.data) {
        // Add the new reminder to the logs
        setEmailLogs(prev => [result.data, ...prev]);
      } else {
        setError(result.message || 'Failed to send reminder');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while sending the reminder');
    } finally {
      setSendingReminder(false);
    }
  }

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="pt-6 h-full">
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading delivery details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !delivery) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center flex-col items-center">
            <p className="text-red-500">Error: {error || 'Delivery not found'}</p>
            <Button asChild className="mt-4">
              <Link href="/deliveries">Back to Deliveries</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full flex flex-col">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Delivery Details</CardTitle>
              <CardDescription className="mt-2">View and manage delivery #{delivery.id}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => openStatusChangeDialog('completed')}
                disabled={delivery.status === 'completed'}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => openStatusChangeDialog('pending')}
                    disabled={delivery.status === 'pending'}
                  >
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openStatusChangeDialog('cancelled')}
                    disabled={delivery.status === 'cancelled'}
                  >
                    Mark as Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Separator className="mt-4" />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium">Delivery Information</h3>
                <div className="space-y-3 mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <Badge className={
                        delivery.status === 'completed' ? 'bg-green-600' : 
                        delivery.status === 'cancelled' ? 'bg-red-600' : 
                        'bg-yellow-600'
                      }>
                        {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recipient Email</p>
                    <p className="font-medium">{delivery.recipientEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Location</p>
                    <p className="font-medium">{delivery.place}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Additional Details</h3>
                <div className="space-y-3 mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{new Date(delivery.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{delivery.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{delivery.notes || 'No notes provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t pt-6">
          <div className="w-full bg-primary/10 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <Button variant="outline" size="sm" onClick={() => setLogsDialogOpen(true)}>
                  View Logs
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {emailLogs.length > 0 ? (
                  <div className="flex items-center text-sm">
                    {emailLogs[0].ok ? (
                      <div className="flex items-center text-green-600">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1.5"></span>
                        <span className="mr-2">Last reminder sent successfully • {new Date(emailLogs[0].send_at).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1.5"></span>
                        <span className="mr-2">Last reminder failed • {new Date(emailLogs[0].send_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="mr-2">No email notifications have been sent yet.</span>
                  </div>
                )}
                <Button onClick={handleSendReminder} disabled={sendingReminder}>
                  <Mail className="h-4 w-4 mr-2" />
                  {sendingReminder ? 'Sending...' : 'Send Reminder to Recipient'}
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Status change dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Delivery Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status to {statusToChange}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => statusToChange && handleStatusChange(statusToChange)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Notification Logs</DialogTitle>
            <DialogDescription>
              History of all email notifications sent for this delivery
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <div className="space-y-3">
              {emailLogs.map((log, index) => (
                <div key={index} className="text-sm border-l-4 pl-3 py-2 flex justify-between items-start" 
                  style={{ borderColor: log.ok ? '#10b981' : '#ef4444' }}>
                  <div>
                    <span className={`font-medium ${log.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {log.ok ? 'Success' : 'Error'}
                    </span>
                    <p className="text-muted-foreground">{log.message}</p>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.send_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setLogsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
