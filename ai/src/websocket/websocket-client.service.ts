import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class WebSocketClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketClient.name);
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await this.ensureConnection();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * Ensure WebSocket connection is established before proceeding
   */
  async ensureConnection(): Promise<void> {
    if (this.socket?.connected) {
      this.logger.log('WebSocket already connected');
      return;
    }

    if (this.connectionPromise) {
      this.logger.log('Connection in progress, waiting...');
      await this.connectionPromise;
      return;
    }

    return this.connect();
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.logger.log(`Connecting to WebSocket (attempt ${this.reconnectAttempts + 1})`);
      
      // Clean up existing socket if any
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      try {
        // Use environment variable or fallback to localhost
        const backendUrl = process.env.BACKEND_URL || 'http://localhost';
        this.socket = io(backendUrl, {
          auth: {
            // AI service authentication - you might want to use a service token
            service: 'ai-service',
          },
          autoConnect: true,
          transports: ['websocket'],
          forceNew: true,
          timeout: 10000,
          reconnection: false, // We'll handle reconnection manually
        });

        this.socket.on('connect', () => {
          this.logger.log('Connected to backend WebSocket server');
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          this.logger.warn(`Disconnected from backend WebSocket server: ${reason}`);
          this.connectionPromise = null;
          
          // Auto-reconnect if not manually disconnected
          if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          this.logger.error('WebSocket connection error:', error);
          this.connectionPromise = null;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
            resolve(); // Don't reject, let reconnection handle it
          } else {
            reject(error);
          }
        });

        // Add timeout
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.logger.warn('WebSocket connection timeout');
            this.connectionPromise = null;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.scheduleReconnect();
              resolve(); // Don't reject, let reconnection handle it
            } else {
              reject(new Error('WebSocket connection timeout after all retries'));
            }
          }
        }, 10000);

      } catch (error) {
        this.logger.error('Failed to initialize WebSocket connection:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send application status update to backend
   */
  async sendApplicationStatusUpdate(applicationId: string, status: string, details?: any) {
    try {
      await this.ensureConnection();
      
      if (!this.socket?.connected) {
        this.logger.warn('WebSocket not connected after connection attempt, skipping status update');
        return;
      }

      const updateData = {
        applicationId,
        status,
        timestamp: new Date().toISOString(),
        source: 'ai-service',
        ...details,
      };

      this.logger.log(`Sending status update: ${applicationId} -> ${status}`);
      this.socket.emit('ai-service-status-update', updateData);
    } catch (error) {
      this.logger.error('Failed to send application status update:', error);
    }
  }

  /**
   * Send application rejection details
   */
  async sendApplicationRejection(applicationId: string, rejectionDetails: any) {
    try {
      await this.ensureConnection();
      
      if (!this.socket?.connected) {
        this.logger.warn('WebSocket not connected after connection attempt, skipping rejection update');
        return;
      }

      const rejectionData = {
        applicationId,
        status: 'REJECTED',
        isRejected: true,
        timestamp: new Date().toISOString(),
        source: 'ai-service',
        ...rejectionDetails,
      };

      this.logger.log(`Sending rejection details for application ${applicationId}`);
      this.socket.emit('ai-service-rejection', rejectionData);
    } catch (error) {
      this.logger.error('Failed to send application rejection:', error);
    }
  }

  /**
   * Send AI review progress updates
   */
  async sendAIReviewProgress(applicationId: string, stage: string, result: string, details?: any) {
    try {
      await this.ensureConnection();
      
      if (!this.socket?.connected) {
        this.logger.warn('WebSocket not connected after connection attempt, skipping review progress update');
        return;
      }

      const progressData = {
        applicationId,
        reviewStage: stage,
        result,
        timestamp: new Date().toISOString(),
        source: 'ai-service',
        ...details,
      };

      this.logger.log(`Sending review progress: ${applicationId} - ${stage} -> ${result}`);
      this.socket.emit('ai-service-review-progress', progressData);
    } catch (error) {
      this.logger.error('Failed to send review progress:', error);
    }
  }
}
