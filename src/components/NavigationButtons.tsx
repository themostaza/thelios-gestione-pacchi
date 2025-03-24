"use client"
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Clipboard, PlusCircle, LayoutDashboard, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NavigationButtons({ isAdmin: initialIsAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check admin status function (same as in authStatus component)
  const checkAdminStatus = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profile')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin status in NavigationButtons:', error);
      return false;
    }
    
    return !!data?.is_admin;
  };
  
  // Check authentication status when component mounts
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        setUserId(session.user.id);
        const adminStatus = await checkAdminStatus(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setUserId(null);
        setIsAdmin(false);
      }
    };
    
    checkAuthStatus();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        setUserId(session.user.id);
        const adminStatus = await checkAdminStatus(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setUserId(null);
        setIsAdmin(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Reset loading state when pathname changes (navigation completes)
  useEffect(() => {
    setLoadingButton(null);
  }, [pathname]);
  
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
      isDisabled: false
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
  
  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href !== pathname) {
      setLoadingButton(href);
      router.push(href);
    }
  };
  
  return (
    <div className='flex flex-row w-full justify-between items-center'>
      {/* Admin buttons displayed first (on the left) */}
      <div className="flex space-x-2">
        {isLoggedIn && isAdmin && adminButtons.map((button, index) => (
          <Button 
            key={index}
            className="justify-start" 
            size="sm"
            disabled={button.isDisabled}
            onClick={(e) => handleNavigate(button.href, e)}
          >
            {loadingButton === button.href ? 
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
              button.icon}
            {button.text}
          </Button>
        ))}
      </div>

      {/* Regular navigation buttons on the right */}
      <div className="flex space-x-2">
        {isLoggedIn && navigationButtons.map((button, index) => (
          <Button 
            key={index} 
            variant="ghost" 
            className="justify-start" 
            size="sm"
            disabled={button.isDisabled}
            onClick={(e) => handleNavigate(button.href, e)}
          >
            {loadingButton === button.href ? 
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
              button.icon}
            {button.text}
          </Button>
        ))}
      </div>
    </div>
  );
} 