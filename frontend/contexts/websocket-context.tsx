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

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://127.0.0.1:3001';
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
    type NewNotificationPayload = { notification?: { title?: string } } & Record<string, unknown>;
    newSocket.on('new-notification', (data: NewNotificationPayload) => {
      console.log('New notification received:', data);
      const title = data.notification?.title ?? 'New notification';
      // Show toast notification
      toast.success('🔔 New Notification!', {
        description: String(title),
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
    type ApplicationStatusPayload = { status?: string } & Record<string, unknown>;
    newSocket.on('application-status-updated', (data: ApplicationStatusPayload) => {
      console.log('Application status updated:', data);
      const status = data.status ?? 'updated';
      toast.info('Application Status Updated', {
        description: `Application status changed to: ${String(status)}`,
        duration: 4000,
      });

      // Dispatch custom event for dashboard to update
      window.dispatchEvent(new CustomEvent('application-status-updated', { detail: data }));
    });

    // Listen for application rejections
    type ApplicationRejectedPayload = { primaryReason?: string; applicationId?: string } & Record<string, unknown>;
    newSocket.on('application-rejected', (data: ApplicationRejectedPayload) => {
      console.log('Application rejected:', data);
      const reason = data.primaryReason ?? '';
      const appId = data.applicationId ?? '';
      toast.error('Application Rejected', {
        description: `Your application has been rejected. ${String(reason)}`,
        duration: 6000,
        action: {
          label: 'View Details',
          onClick: () => window.location.href = `/applications/${String(appId)}`,
        },
      });

      // Dispatch custom event for dashboard to update
      window.dispatchEvent(new CustomEvent('application-rejected', { detail: data }));
    });

    // Listen for AI review progress
    type AIReviewPayload = { result?: string } & Record<string, unknown>;
    newSocket.on('ai-review-progress', (data: AIReviewPayload) => {
      console.log('AI review progress:', data);
      
      const statusMessages: Record<string, string> = {
        'STARTED': 'AI review has started',
        'IN_PROGRESS': 'AI is analyzing your application',
        'APPROVED': 'AI review completed - moving to next stage',
        'REJECTED': 'AI review completed - application rejected',
      };

      const message = statusMessages[String(data.result)] || `AI review: ${String(data.result)}`;
      
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
