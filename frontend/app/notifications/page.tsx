"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  Calendar,
  AlertCircle,
  FileText,
  Trophy,
  Clock,
  User,
  Settings,
  ExternalLink,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ApiClient, type Notification } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <NotificationsContent />
      </div>
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const itemsPerPage = 20;

  // Redirect admin users to admin panel
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  // Calculate filtered notifications based on active tab (memoized for performance)
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(notification => {
      switch (activeTab) {
        case "unread":
          return !notification.read;
        case "read":
          return notification.read;
        default:
          return true; // "all" shows everything
      }
    });
  }, [allNotifications, activeTab]);

  // Calculate pagination for filtered notifications (memoized for performance)
  const { totalPages, paginatedNotifications } = useMemo(() => {
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    return { totalPages, paginatedNotifications };
  }, [filteredNotifications, currentPage, itemsPerPage]);

  // Calculate counts from client-side data (memoized for performance)
  const { total, unreadCount, readCount } = useMemo(() => {
    const total = allNotifications.length;
    const unreadCount = allNotifications.filter(n => !n.read).length;
    const readCount = allNotifications.filter(n => n.read).length;
    
    return { total, unreadCount, readCount };
  }, [allNotifications]);

  // Auto-adjust page if current page is out of bounds after filtering
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching all notifications...');
      
      // Fetch a large number to get all notifications
      // You might want to implement pagination here if you have thousands of notifications
      const response = await ApiClient.getNotifications(1, 1000); // Fetch first 1000 notifications
      setAllNotifications(response.notifications);
      setCurrentPage(1); // Reset to first page when refetching
      
      console.log('All notifications fetched successfully:', response);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      
      // More detailed error handling
      let errorMessage = 'Failed to load notifications';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for specific error types
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Please sign in again to view notifications';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to view notifications';
        } else if (err.message.includes('404')) {
          errorMessage = 'Notifications service not found';
        } else if (err.message.includes('400')) {
          errorMessage = 'Invalid request. Please try refreshing the page.';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    if (processingIds.has(id)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(id));
      await ApiClient.markNotificationAsRead(id);
      
      // Update the notification in our local state
      setAllNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to mark notification as read');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await ApiClient.markAllNotificationsAsRead();
      
      // Update all notifications to read in local state
      setAllNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (processingIds.has(id)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(id));
      await ApiClient.deleteNotification(id);
      
      // Remove the notification from local state
      setAllNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Reset to page 1 if current page becomes empty
      const newFilteredNotifications = allNotifications.filter(n => n.id !== id).filter(notification => {
        switch (activeTab) {
          case "unread":
            return !notification.read;
          case "read":
            return notification.read;
          default:
            return true;
        }
      });
      
      const newTotalPages = Math.ceil(newFilteredNotifications.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS_CHANGE':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'NEW_APPLICATION_SUBMITTED':
        return <Trophy className="h-5 w-5 text-green-500" />;
      case 'APPLICATION_REVIEW_ASSIGNED':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'APPLICATION_REVIEW_COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <Settings className="h-5 w-5 text-orange-500" />;
      case 'DEADLINE_REMINDER':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleTabChange = (value: string) => {
    console.log(`🔄 Client-side filter: Switching to ${value} tab (no server request)`);
    setActiveTab(value as "all" | "unread" | "read");
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your hackathon journey
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchAllNotifications()}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <BellRing className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{readCount}</div>
                  <div className="text-sm text-muted-foreground">Read</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="px-6 pt-6 pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({total})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                  <TabsTrigger value="read">Read ({readCount})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Loading notifications...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Error Loading Notifications</h3>
                      <p className="text-muted-foreground mb-4">{error}</p>
                      
                      {error.includes('400') && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4 text-sm">
                          <p className="text-yellow-800 dark:text-yellow-200">
                            💡 <strong>Development Note:</strong> The notifications API might not be fully implemented yet. 
                            This is normal during development and will be resolved once the backend is complete.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Button onClick={() => fetchAllNotifications()}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Try Again
                        </Button>
                        
                        <div className="text-xs text-muted-foreground">
                          Having issues? Check the browser console for more details.
                        </div>
                      </div>
                    </div>
                  ) : paginatedNotifications.length > 0 ? (
                    <div className="space-y-4">
                      {paginatedNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h4 className="font-medium leading-none">
                                  {notification.title}
                                  {!notification.read && (
                                    <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {getRelativeTime(notification.createdAt)}
                                  </span>
                                  {notification.sender && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {notification.sender.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {notification.actionUrl && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0"
                                  >
                                    <Link href={notification.actionUrl}>
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                                
                                {!notification.read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={processingIds.has(notification.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  disabled={processingIds.has(notification.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                      <p className="text-muted-foreground">
                        {activeTab === "unread" 
                          ? "All caught up! No unread notifications." 
                          : activeTab === "read"
                          ? "No read notifications found."
                          : "You'll see notifications here when you have updates about your applications."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
