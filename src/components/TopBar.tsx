import AuthStatus from '@/components/authStatus'
import NavigationButtons from '@/components/NavigationButtons'

export default async function TopBar() {
  return (
    <div className='w-full bg-secondary'>
      <div className='flex justify-between items-center p-2 w-full max-w-screen-xl mx-auto'>
        <div className='flex items-center space-x-4 w-full'>
          <NavigationButtons />
          <AuthStatus />
        </div>
      </div>
    </div>
  )
}
