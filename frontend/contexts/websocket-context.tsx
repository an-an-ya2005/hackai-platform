"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const connect = useCallback(() => {
    const token = authService.getToken();
    if (!user || !token) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join user's personal room for notifications
      newSocket.emit('join-user-room', { userId: user.id });
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new notifications
    newSocket.on('new-notification', (data: any) => {
      console.log('New notification received:', data);
      
      // Show toast notification
      toast.success('🔔 New Notification!', {
        description: data.notification.title,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => window.location.href = '/notifications',
        },
      });

      // Dispatch custom event for notification bell to update
      window.dispatchEvent(new CustomEvent('new-notification', { detail: data }));
    });

    // Listen for application status updates
    newSocket.on('application-status-updated', (data: any) => {
      console.log('Application status updated:', data);
      
      toast.info('Application Status Updated', {
        description: `Application status changed to: ${data.status}`,
        duration: 4000,
      });

      // Dispatch custom event for dashboard to update
      window.dispatchEvent(new CustomEvent('application-status-updated', { detail: data }));
    });

    // Listen for application rejections
    newSocket.on('application-rejected', (data: any) => {
      console.log('Application rejected:', data);
      
      toast.error('Application Rejected', {
        description: `Your application has been rejected. ${data.primaryReason || ''}`,
        duration: 6000,
        action: {
          label: 'View Details',
          onClick: () => window.location.href = `/applications/${data.applicationId}`,
        },
      });

      // Dispatch custom event for dashboard to update
      window.dispatchEvent(new CustomEvent('application-rejected', { detail: data }));
    });

    // Listen for AI review progress
    newSocket.on('ai-review-progress', (data: any) => {
      console.log('AI review progress:', data);
      
      const statusMessages: Record<string, string> = {
        'STARTED': 'AI review has started',
        'IN_PROGRESS': 'AI is analyzing your application',
        'APPROVED': 'AI review completed - moving to next stage',
        'REJECTED': 'AI review completed - application rejected',
      };

      const message = statusMessages[data.result] || `AI review: ${data.result}`;
      
      toast.info('AI Review Update', {
        description: message,
        duration: 4000,
      });

      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('ai-review-progress', { detail: data }));
    });

    setSocket(newSocket);
  }, [user]);

  const disconnect = useCallback(() => {
    setSocket((currentSocket) => {
      if (currentSocket) {
        currentSocket.disconnect();
        setIsConnected(false);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
