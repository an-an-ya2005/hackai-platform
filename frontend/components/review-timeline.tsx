"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Bot,
  User,
  FileText,
  Loader2,
  RefreshCw
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { useWebSocket } from "@/contexts/websocket-context";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  stage: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'ERROR';
  timestamp?: string;
  feedback?: string;
  score?: number;
  type: 'AI' | 'HUMAN';
  details?: any;
  errorMessage?: string;
}

interface ReviewTimelineProps {
  applicationId: string;
  currentStatus: string;
}

export function ReviewTimeline({ applicationId, currentStatus }: ReviewTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { socket } = useWebSocket();

  const getStageDisplayName = (stage: string) => {
    const stageNames: Record<string, string> = {
      'EXTERNAL_IDEA': 'External Idea Review',
      'EXTERNAL_IDEA_REVIEW': 'External Idea Review',
      'INTERNAL_IDEA': 'Internal Idea Review', 
      'INTERNAL_IDEA_REVIEW': 'Internal Idea Review',
      'CATEGORIZATION': 'Categorization',
      'IMPLEMENTATION': 'Implementation Review',
      'IMPLEMENTATION_FEASIBILITY': 'Implementation Review',
      'IMPLEMENTATION_REVIEW': 'Implementation Review',
      'COST': 'Cost Analysis',
      'COST_ANALYSIS': 'Cost Analysis',
      'COST_REVIEW': 'Cost Analysis',
      'IMPACT': 'Impact Assessment',
      'CUSTOMER_IMPACT': 'Impact Assessment', 
      'IMPACT_REVIEW': 'Impact Assessment',
      'MANUAL_REVIEW': 'Manual Review',
    };
    return stageNames[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'REJECTED':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'IN_PROGRESS':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'ERROR':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const fetchAIReviewStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ApiClient.getAIReviewStatus(applicationId);
      console.log('AI Review Status Data:', data);
      
      if (data && data.stages && data.stages.length > 0) {
        // Convert API response to timeline format with proper status mapping
        const timelineEvents: TimelineEvent[] = data.stages.map((stage: any) => {
          // Map result values to status values
          let status: TimelineEvent['status'] = 'PENDING';
          if (stage.result === 'APPROVED') status = 'APPROVED';
          else if (stage.result === 'REJECTED') status = 'REJECTED';
          else if (stage.result === 'PENDING') status = 'PENDING';
          else if (stage.processedAt && stage.result !== 'APPROVED' && stage.result !== 'REJECTED') status = 'IN_PROGRESS';
          else if (stage.errorMessage) status = 'ERROR';

          return {
            id: stage.id || `${stage.type}-${Date.now()}`,
            stage: stage.type || stage.stage,
            status,
            timestamp: stage.processedAt || stage.createdAt,
            feedback: stage.feedback,
            score: stage.score,
            type: 'AI' as const,
            details: stage.metadata,
            errorMessage: stage.errorMessage,
          };
        });
        
        // Sort by creation time to show proper chronological order
        timelineEvents.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeA - timeB;
        });
        
        setTimeline(timelineEvents);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      } else {
        // If no AI reviews yet, generate expected stages based on current status
        const expectedStages = generateExpectedStages(currentStatus);
        setTimeline(expectedStages);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch AI review status:', err);
      setError('Failed to load review timeline');
      
      // Still show expected stages even on error
      const expectedStages = generateExpectedStages(currentStatus);
      setTimeline(expectedStages);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  const generateExpectedStages = (status: string): TimelineEvent[] => {
    const allStages = [
      { stage: 'EXTERNAL_IDEA', order: 1 },
      { stage: 'INTERNAL_IDEA', order: 2 },
      { stage: 'CATEGORIZATION', order: 3 },
      { stage: 'IMPLEMENTATION_FEASIBILITY', order: 4 },
      { stage: 'COST_ANALYSIS', order: 5 },
      { stage: 'CUSTOMER_IMPACT', order: 6 },
    ];

    const statusToOrder: Record<string, number> = {
      'DRAFT': 0,
      'SUBMITTED': 1,
      'EXTERNAL_IDEA_REVIEW': 1,
      'INTERNAL_IDEA_REVIEW': 2,
      'CATEGORIZATION': 3,
      'IMPLEMENTATION_REVIEW': 4,
      'COST_REVIEW': 5,
      'IMPACT_REVIEW': 6,
      'UNDER_REVIEW': 7,
      'ACCEPTED': 7,
      'REJECTED': -1,
    };

    const currentOrder = statusToOrder[status] || 0;
    
    return allStages.map((stageInfo) => ({
      id: `expected-${stageInfo.stage}`,
      stage: stageInfo.stage,
      status: stageInfo.order < currentOrder ? 'APPROVED' as const :
              stageInfo.order === currentOrder ? 'IN_PROGRESS' as const : 'PENDING' as const,
      type: 'AI' as const,
      timestamp: stageInfo.order < currentOrder ? new Date().toISOString() : undefined,
    }));
  };

  useEffect(() => {
    fetchAIReviewStatus();
  }, [applicationId, currentStatus]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if there are pending or in-progress stages
      const hasPendingOrInProgress = timeline.some(event => 
        event.status === 'PENDING' || event.status === 'IN_PROGRESS'
      );
      
      if (hasPendingOrInProgress) {
        fetchAIReviewStatus();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, timeline]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAIReviewProgress = (data: any) => {
      if (data.applicationId === applicationId) {
        console.log('Real-time AI review progress update:', data);
        
        // Update specific stage in timeline
        setTimeline(prev => {
          const existingIndex = prev.findIndex(event => event.stage === data.stage || event.stage === data.type);
          
          if (existingIndex >= 0) {
            // Update existing stage
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: data.result === 'APPROVED' ? 'APPROVED' : 
                     data.result === 'REJECTED' ? 'REJECTED' : 
                     data.result === 'ERROR' ? 'ERROR' : 'IN_PROGRESS',
              timestamp: new Date().toISOString(),
              feedback: data.feedback || updated[existingIndex].feedback,
              score: data.score || updated[existingIndex].score,
              details: data.details || updated[existingIndex].details,
            };
            return updated;
          } else {
            // Add new stage
            const newEvent: TimelineEvent = {
              id: `realtime-${data.stage || data.type}-${Date.now()}`,
              stage: data.stage || data.type,
              status: data.result === 'APPROVED' ? 'APPROVED' : 
                     data.result === 'REJECTED' ? 'REJECTED' : 
                     data.result === 'ERROR' ? 'ERROR' : 'IN_PROGRESS',
              timestamp: new Date().toISOString(),
              feedback: data.feedback,
              score: data.score,
              type: 'AI',
              details: data.details,
            };
            
            return [...prev, newEvent].sort((a, b) => {
              const timeA = new Date(a.timestamp || 0).getTime();
              const timeB = new Date(b.timestamp || 0).getTime();
              return timeA - timeB;
            });
          }
        });

        setLastUpdated(new Date().toISOString());
        
        // Show toast for significant updates
        if (data.result === 'APPROVED' || data.result === 'REJECTED') {
          toast.info(`${getStageDisplayName(data.stage || data.type)} completed`, {
            description: `Result: ${data.result}`,
            duration: 4000,
          });
        }
      }
    };

    const handleApplicationStatusUpdate = (data: any) => {
      if (data.applicationId === applicationId) {
        console.log('Application status update, refreshing timeline:', data);
        // Refresh timeline when application status changes
        fetchAIReviewStatus();
      }
    };

    const handleApplicationRejected = (data: any) => {
      if (data.applicationId === applicationId) {
        console.log('Application rejected, refreshing timeline:', data);
        // Mark all pending stages as rejected and refresh
        setTimeline(prev => prev.map(event => ({
          ...event,
          status: event.status === 'PENDING' ? 'REJECTED' : event.status
        })));
        fetchAIReviewStatus();
      }
    };

    // Listen to multiple event types
    socket.on('ai-review-progress', handleAIReviewProgress);
    socket.on('application-status-updated', handleApplicationStatusUpdate);
    socket.on('application-rejected', handleApplicationRejected);

    return () => {
      socket.off('ai-review-progress', handleAIReviewProgress);
      socket.off('application-status-updated', handleApplicationStatusUpdate);
      socket.off('application-rejected', handleApplicationRejected);
    };
  }, [socket, applicationId]);

  const handleRefresh = () => {
    fetchAIReviewStatus();
    toast.success("Timeline refreshed");
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Review Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Review Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAutoRefresh}
              className="text-xs"
            >
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {/* Progress Summary */}
        {timeline.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress Overview</span>
              <span className="text-xs text-muted-foreground">
                {timeline.filter(e => e.status === 'APPROVED').length} of {timeline.length} completed
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(timeline.filter(e => e.status === 'APPROVED').length / timeline.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-6 top-8 h-6 w-0.5 bg-border" />
              )}
              
              {/* Timeline item */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-border">
                  {getStatusIcon(event.status)}
                </div>
                
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium">
                      {getStageDisplayName(event.stage)}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(event.status)} border-none text-xs`}
                    >
                      {event.status}
                    </Badge>
                    {event.type === 'AI' ? (
                      <Bot className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  
                  {event.timestamp && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  )}
                  
                  {event.score && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">
                        Confidence Score: {(event.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  {event.feedback && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {event.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.errorMessage && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error: {event.errorMessage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {timeline.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No review data available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
