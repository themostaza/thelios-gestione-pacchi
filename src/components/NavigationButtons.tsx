"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Clipboard, PlusCircle, LayoutDashboard, Users } from "lucide-react";

export default function NavigationButtons({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  
  // Regular navigation buttons - visible to all users
  const navigationButtons = [
    {
      href: "/deliveries",
      text: "All Deliveries",
      icon: <Clipboard className="h-4 w-4 mr-2" />,
      isDisabled: pathname === '/deliveries'
    },
    {
      href: "/delivery/new",
      text: "New Delivery",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      isDisabled: pathname !== '/deliveries'
    }
  ];

  // Admin-only navigation buttons
  const adminButtons = [
    {
      href: "/dashboard",
      text: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      isDisabled: pathname === '/dashboard'
    },
    {
      href: "/users",
      text: "User Management",
      icon: <Users className="h-4 w-4 mr-2" />,
      isDisabled: pathname === '/users'
    }
  ];
  
  return (
    <div className='flex flex-row w-full justify-between items-center'>
      {/* Admin buttons displayed first (on the left) */}
      <div className="flex space-x-2">
        {isAdmin && adminButtons.map((button, index) => (
          <Button 
            key={index}
            asChild 
            className="justify-start" 
            size="sm"
            disabled={button.isDisabled}
          >
            <Link href={button.href}>
              {button.icon}
              {button.text}
            </Link>
          </Button>
        ))}
      </div>

      {/* Regular navigation buttons on the right */}
      <div className="flex space-x-2">
        {navigationButtons.map((button, index) => (
          <Button 
            key={index} 
            variant="ghost" 
            asChild
            className="justify-start" 
            size="sm"
            disabled={button.isDisabled}
          >
            <Link href={button.href}>
              {button.icon}
              {button.text}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
} 