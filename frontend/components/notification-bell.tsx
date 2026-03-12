"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiClient, type Notification } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchUnreadCount();
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Add real-time polling for notifications
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Refresh notifications when the window gains focus (user comes back to the app)
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      console.log('Notification bell received new notification:', event.detail);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      setHasNewNotification(true);
      
      // If notifications dropdown is open, refresh the list
      if (isOpen) {
        fetchNotifications();
      }
      
      // Remove animation after 3 seconds
      setTimeout(() => setHasNewNotification(false), 3000);
    };

    const handleApplicationStatusUpdate = () => {
      // Refresh notifications when application status changes
      if (isOpen) {
        fetchNotifications();
      }
      fetchUnreadCount();
    };

    // Add event listeners for WebSocket events
    window.addEventListener('new-notification', handleNewNotification as EventListener);
    window.addEventListener('application-status-updated', handleApplicationStatusUpdate);
    window.addEventListener('application-rejected', handleApplicationStatusUpdate);

    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener);
      window.removeEventListener('application-status-updated', handleApplicationStatusUpdate);
      window.removeEventListener('application-rejected', handleApplicationStatusUpdate);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const count = await ApiClient.getUnreadCount();
      
      // Check if there's a new notification (count increased)
      if (count > prevUnreadCount && prevUnreadCount > 0) {
        setHasNewNotification(true);
        
        // Show toast notification
        toast.success("🔔 You have a new notification!", {
          description: "Click the bell icon to view your notifications",
          duration: 4000,
        });
        
        // Play notification sound (optional)
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore errors if sound can't play (browser restrictions)
          });
        } catch (error) {
          // Ignore sound errors
        }
        
        // Remove animation after 3 seconds
        setTimeout(() => setHasNewNotification(false), 3000);
      }
      
      setPrevUnreadCount(unreadCount);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.getNotifications(1, 10);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await ApiClient.markNotificationAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }

      setIsOpen(false);

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ApiClient.markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'APPLICATION_STATUS_CHANGE':
        return <Check className="h-4 w-4 text-blue-500" />;
      case 'NEW_APPLICATION_SUBMITTED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'DEADLINE_REMINDER':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative h-9 w-9 p-0 transition-all duration-300 ${
            hasNewNotification ? 'animate-bounce' : ''
          }`}
        >
          <Bell className={`h-4 w-4 transition-all duration-300 ${
            hasNewNotification ? 'text-blue-600 animate-pulse' : ''
          }`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs transition-all duration-300 ${
                hasNewNotification ? 'animate-ping scale-110' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {hasNewNotification && (
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-ping"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-sm">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                    !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm leading-tight">
                        {notification.title}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
