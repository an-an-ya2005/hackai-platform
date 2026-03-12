"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);

  const handleCallback = useCallback(async () => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const token = searchParams.get('token');
    
    if (token) {
      try {
        // Store the token
        authService.setToken(token);
        
        // Refresh user data to get the complete profile
        await refreshUser();
        
        // Get the user profile to determine redirect
        const userProfile = await authService.getProfile(token);
        
        toast.success("Sign in successful!");
        
        // Redirect based on user role
        if (userProfile.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error("Failed to complete sign in. Please try again.");
        router.push('/auth/signin');
      }
    } else {
      toast.error("Authentication failed. Please try again.");
      router.push('/auth/signin');
    }
  }, [searchParams, router, refreshUser]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
