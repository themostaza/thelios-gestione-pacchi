import LoginForm from '@/components/loginForm'
import RegisterForm from '@/components/registerForm'

export default function LoginPage() {
  return (
    <div className='container mx-auto p-4'>
      <div className='flex flex-col md:flex-row gap-8 justify-center items-center min-h-[80vh]'>
        <div className='w-full max-w-md'>
          <LoginForm />
        </div>
        <div className='hidden md:block h-72 border-r border-gray-200'></div>
        <div className='w-full max-w-md'>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
