/**
 * API Correlation Monitor
 * 
 * Tracks API calls and correlates them with Web Vitals metrics
 * Uses XMLHttpRequest and fetch interception
 * 
 * This helps identify which API calls are blocking LCP, INP, etc.
 */

import { APICallMetric } from '../types/monitoring.types';

type APICallback = (call: APICallMetric) => void;

interface PendingRequest {
  url: string;
  method: string;
  startTime: number;
}

export class APICorrelationMonitor {
  private apiCalls: APICallMetric[] = [];
  private callbacks: APICallback[] = [];
  private pendingRequests = new Map<string, PendingRequest>();
  private initialized = false;
  
  // Track LCP and INP timing for correlation
  private lcpTime: number | null = null;
  private inpEvents = new Map<number, boolean>();

  /**
   * Initialize API monitoring by intercepting fetch and XMLHttpRequest
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('APICorrelationMonitor already initialized');
      return;
    }

    this.interceptFetch();
    this.interceptXHR();
    
    this.initialized = true;
    console.info('APICorrelationMonitor initialized');
  }

  /**
   * Set LCP time for correlation
   */
  public setLCPTime(time: number): void {
    this.lcpTime = time;
    this.correlateWithLCP();
  }

  /**
   * Record an INP event time for correlation
   */
  public recordINPEvent(time: number): void {
    this.inpEvents.set(time, true);
    this.correlateWithINP();
  }

  /**
   * Register a callback for new API calls
   */
  public onAPICall(callback: APICallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all collected API calls
   */
  public getAPICalls(): APICallMetric[] {
    return [...this.apiCalls];
  }

  /**
   * Get API calls that may have blocked LCP
   */
  public getLCPBlockingCalls(): APICallMetric[] {
    return this.apiCalls.filter(call => call.blockedLCP);
  }

  /**
   * Get API calls that may have blocked INP
   */
  public getINPBlockingCalls(): APICallMetric[] {
    return this.apiCalls.filter(call => call.blockedINP);
  }

  /**
   * Get average API latency
   */
  public getAverageLatency(): number {
    if (this.apiCalls.length === 0) return 0;
    
    const totalLatency = this.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalLatency / this.apiCalls.length;
  }

  /**
   * Get slowest API calls
   */
  public getSlowestCalls(count: number = 10): APICallMetric[] {
    return [...this.apiCalls]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  /**
   * Clear all collected API calls
   */
  public clear(): void {
    this.apiCalls = [];
    this.pendingRequests.clear();
  }

  // Private methods - fetch interception

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = function(...args: Parameters<typeof fetch>): Promise<Response> {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();
      
      const requestId = self.generateRequestId();
      const startTime = performance.now();

      // Track pending request
      self.pendingRequests.set(requestId, {
        url,
        method,
        startTime,
      });

      return originalFetch.apply(this, args)
        .then(async (response) => {
          const endTime = performance.now();
          
          // Clone response to read size without consuming it
          const clone = response.clone();
          let size = 0;
          
          try {
            const blob = await clone.blob();
            size = blob.size;
          } catch (e) {
            // Size not available
          }

          self.recordAPICall({
            url,
            method,
            startTime,
            duration: endTime - startTime,
            ttfb: endTime - startTime, // Approximation
            status: response.status,
            size,
          });

          self.pendingRequests.delete(requestId);
          
          return response;
        })
        .catch((error) => {
          const endTime = performance.now();
          
          self.recordAPICall({
            url,
            method,
            startTime,
            duration: endTime - startTime,
            ttfb: endTime - startTime,
            status: 0, // Network error
            size: 0,
          });

          self.pendingRequests.delete(requestId);
          
          throw error;
        });
    };
  }

  // Private methods - XMLHttpRequest interception

  private interceptXHR(): void {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true
    ): void {
      (this as any)._monitoringData = {
        method: method.toUpperCase(),
        url: url.toString(),
      };
      
      return originalOpen.apply(this, [method, url, async]);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this;
      const monitoringData = (xhr as any)._monitoringData;
      
      if (!monitoringData) {
        return originalSend.apply(this, [body]);
      }

      const startTime = performance.now();
      let ttfb: number | null = null;

      // Track TTFB
      xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState === 2 && ttfb === null) { // Headers received
          ttfb = performance.now() - startTime;
        }
      });

      // Track completion
      xhr.addEventListener('loadend', function() {
        const endTime = performance.now();
        
        self.recordAPICall({
          url: monitoringData.url,
          method: monitoringData.method,
          startTime,
          duration: endTime - startTime,
          ttfb: ttfb || (endTime - startTime),
          status: xhr.status,
          size: parseInt(xhr.getResponseHeader('content-length') || '0', 10),
        });
      });

      return originalSend.apply(this, [body]);
    };
  }

  // Utility methods

  private recordAPICall(callData: Omit<APICallMetric, 'blockedLCP' | 'blockedINP' | 'associatedMetricId'>): void {
    const metric: APICallMetric = {
      ...callData,
      blockedLCP: this.checkLCPBlocking(callData.startTime, callData.duration),
      blockedINP: this.checkINPBlocking(callData.startTime, callData.duration),
    };

    this.apiCalls.push(metric);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error in API callback:', error);
      }
    });

    // Log slow API calls
    if (metric.duration > 1000) {
      console.warn('[API] Slow API call detected:', {
        url: metric.url,
        duration: `${metric.duration.toFixed(2)}ms`,
        ttfb: `${metric.ttfb.toFixed(2)}ms`,
        blockedLCP: metric.blockedLCP,
        blockedINP: metric.blockedINP,
      });
    }
  }

  private checkLCPBlocking(startTime: number, duration: number): boolean {
    if (this.lcpTime === null) return false;
    
    // Check if API call overlaps with LCP
    const endTime = startTime + duration;
    return startTime < this.lcpTime && endTime > this.lcpTime;
  }

  private checkINPBlocking(startTime: number, duration: number): boolean {
    const endTime = startTime + duration;
    
    // Check if API call overlaps with any INP event
    for (const [inpTime] of this.inpEvents) {
      if (startTime < inpTime && endTime > inpTime) {
        return true;
      }
    }
    
    return false;
  }

  private correlateWithLCP(): void {
    if (this.lcpTime === null) return;

    // Update existing API calls with LCP correlation
    this.apiCalls.forEach(call => {
      if (!call.blockedLCP) {
        call.blockedLCP = this.checkLCPBlocking(call.startTime, call.duration);
      }
    });
  }

  private correlateWithINP(): void {
    // Update existing API calls with INP correlation
    this.apiCalls.forEach(call => {
      if (!call.blockedINP) {
        call.blockedINP = this.checkINPBlocking(call.startTime, call.duration);
      }
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let instance: APICorrelationMonitor | null = null;

export function getAPICorrelationMonitor(): APICorrelationMonitor {
  if (!instance) {
    instance = new APICorrelationMonitor();
  }
  return instance;
}