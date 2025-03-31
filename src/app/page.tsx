import { redirect } from 'next/navigation'

export default function LoginPage() {
  redirect('/auth')
  // The code below won't execute due to the redirect
  return null
}
