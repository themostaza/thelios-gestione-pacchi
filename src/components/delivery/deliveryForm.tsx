'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send, Upload, Camera } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { saveDelivery } from '@/app/actions/deliveryActions'
import { extractTextFromImage } from '@/app/actions/scanActions'
import RecipientSelect from '@/components/delivery/recipientSelect'
import GenericCardView from '@/components/GenericCardView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { DeliveryFormData } from '@/lib/types/delivery'
import { deliverySchema } from '@/lib/validations/delivery'

export default function DeliveryForm() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState(t('common.loading'))
  const [isScanning, setIsScanning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email || 'Not authenticated')
    }

    getUser()
  }, [])

  const form = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      recipient: '',
      place: '',
      notes: '',
    },
  })

  const onSubmit = async (data: DeliveryFormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('recipient', data.recipient)
      formData.append('place', data.place)
      formData.append('notes', data.notes)

      const result = await saveDelivery(formData)

      if (result.success) {
        form.reset()
        clearPreview()
        toast({
          title: 'Delivery registered successfully',
          description: (
            <div className='flex flex-col gap-2'>
              <span className='truncate'>
                Delivery ID: {result.data.id}, Created at: {new Date(result.data.created_at).toLocaleString()}
              </span>
              <span className='truncate'>Recipient: {result.data.recipientEmail}</span>
              <Button
                size='sm'
                asChild
                className='mt-2'
              >
                <Link href={`/delivery/${result.data.id}`}>View Delivery</Link>
              </Button>
            </div>
          ),
        })
      } else {
        if (result.errors) {
          Object.keys(form.getValues()).forEach((key) => {
            const fieldKey = key as keyof DeliveryFormData
            const errorValue = result.errors[fieldKey]
            form.setError(fieldKey, {
              type: 'server',
              message: Array.isArray(errorValue) ? errorValue.join(', ') : errorValue,
            })
          })
        }

        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setPreviewImage(previewUrl)

    setIsScanning(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const result = await extractTextFromImage(formData)

      if (result.success && result.text) {
        form.setValue('recipient', result.text)
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to extract text from image',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error processing image:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while processing the image',
        variant: 'destructive',
      })
    } finally {
      setIsScanning(false)
    }
  }

  const takePhoto = async () => {
    setShowCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: 'Camera Error',
        description: 'Unable to access the camera',
        variant: 'destructive',
      })
      setShowCamera(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const previewUrl = canvas.toDataURL('image/jpeg')
      setPreviewImage(previewUrl)

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            setIsScanning(true)

            const stream = video.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
            setShowCamera(false)

            const formData = new FormData()
            formData.append('image', blob, 'camera-capture.jpg')

            try {
              const result = await extractTextFromImage(formData)

              if (result.success && result.text) {
                form.setValue('recipient', result.text)
              } else {
                toast({
                  title: 'Error',
                  description: result.message || 'Failed to extract text from image',
                  variant: 'destructive',
                })
              }
            } catch (error) {
              console.error('Error processing image:', error)
              toast({
                title: 'Error',
                description: 'An unexpected error occurred while processing the image',
                variant: 'destructive',
              })
            } finally {
              setIsScanning(false)
            }
          }
        },
        'image/jpeg',
        0.95
      )
    }
  }

  const closeCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
    setShowCamera(false)
  }

  const clearPreview = () => {
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage)
    }
    setPreviewImage(null)
  }

  const headerRight = (
    <div className='text-muted-foreground text-sm text-right'>
      <div>
        <strong>From:</strong> {userEmail}
      </div>
    </div>
  )

  const footerContent = (
    <div className='flex justify-end items-center w-full'>
      <Button
        type='submit'
        form='delivery-form'
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
            Registering...
          </>
        ) : (
          <>
            <Send
              size={20}
              className='mr-2'
            />
            {t('deliveries.register')}
          </>
        )}
      </Button>
    </div>
  )

  return (
    <>
      {showCamera && (
        <div className='fixed inset-0 z-50 bg-black flex flex-col items-center justify-center'>
          <div className='relative w-full max-w-lg'>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className='w-full'
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            <canvas
              ref={canvasRef}
              className='hidden'
            />

            <div className='absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-black/50'>
              <Button
                type='button'
                onClick={closeCamera}
                variant='destructive'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={capturePhoto}
              >
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}

      <GenericCardView
        title={t('deliveries.newDelivery')}
        description={t('deliveries.newDelivery')}
        headerRight={headerRight}
        footer={footerContent}
      >
        <Form {...form}>
          <form
            id='delivery-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='w-full h-full'
          >
            <div className='space-y-4 p-2'>
              <div className='border rounded-md p-4 space-y-4'>
                <h3 className='text-sm font-medium'>{t('deliveries.scanLabel') || 'Scansione Etichetta'}</h3>

                <div className='flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md'>
                  {previewImage ? (
                    <div className='space-y-4 w-full'>
                      <div className='relative'>
                        <Image
                          src={previewImage}
                          alt='Captured label'
                          className='max-h-64 mx-auto object-contain rounded-md'
                          width={500}
                          height={300}
                          style={{ maxHeight: '16rem', width: 'auto' }}
                        />
                        <Button
                          variant='secondary'
                          size='sm'
                          className='absolute top-2 right-2'
                          onClick={clearPreview}
                        >
                          ×
                        </Button>
                      </div>

                      {isScanning && (
                        <div className='flex items-center justify-center mt-4'>
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                          <span className='text-sm'>{t('deliveries.scanning') || 'Elaborazione...'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='space-y-2 text-center'>
                      <div className='mx-auto h-12 w-12 text-gray-400 flex items-center justify-center'>
                        <Upload
                          size={48}
                          className='text-gray-400'
                        />
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('deliveries.uploadLabelText') || "Scatta una foto dell'etichetta o carica un'immagine"}</p>
                      <div className='flex justify-center gap-4 mt-4'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={takePhoto}
                          disabled={isSubmitting || isScanning}
                        >
                          <Camera className='h-4 w-4 mr-2' />
                          {t('deliveries.takePhoto') || 'Fotocamera'}
                        </Button>

                        <Button
                          type='button'
                          variant='outline'
                          disabled={isSubmitting || isScanning}
                          asChild
                        >
                          <label htmlFor='label-image'>
                            <input
                              id='label-image'
                              type='file'
                              accept='image/*'
                              className='hidden'
                              onChange={handleImageUpload}
                              disabled={isSubmitting || isScanning}
                            />
                            <Upload className='h-4 w-4 mr-2' />
                            {t('deliveries.uploadFile') || 'Carica file'}
                          </label>
                        </Button>
                      </div>

                      {isScanning && (
                        <div className='flex items-center justify-center mt-4'>
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                          <span className='text-sm'>{t('deliveries.scanning') || 'Elaborazione...'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name='recipient'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='recipient'>{t('deliveries.recipient')}</FormLabel>
                    <FormControl>
                      <RecipientSelect
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='place'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='place'>{t('deliveries.place')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id='place'
                        placeholder={t('deliveries.enterPlace')}
                        disabled={isSubmitting}
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='notes'>{t('common.notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id='notes'
                        placeholder={t('common.optionalNotes')}
                        rows={4}
                        disabled={isSubmitting}
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </GenericCardView>
    </>
  )
}
