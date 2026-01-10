/**
 * TanStack Query Monitor
 * 
 * Works with both @tanstack/react-query and @tanstack/vue-query
 * Tracks query performance, cache hits, and correlates with Web Vitals
 * 
 * Compatible with TanStack Query v4 and v5
 */

import { QueryCacheMetric, QueryCacheStats } from '../types/monitoring.types';

type QueryCallback = (metric: QueryCacheMetric) => void;

// Generic query client interface compatible with React Query and Vue Query
interface GenericQueryClient {
  getQueryCache(): {
    getAll(): any[];
    subscribe(callback: (event: any) => void): () => void;
  };
  getMutationCache?(): any;
}

export class TanStackQueryMonitor {
  private queryMetrics: QueryCacheMetric[] = [];
  private queryExecutions = new Map<string, { count: number; totalDuration: number }>();
  private callbacks: QueryCallback[] = [];
  private queryClient: GenericQueryClient | null = null;
  private unsubscribe: (() => void) | null = null;
  private initialized = false;

  // Track LCP and INP times for correlation
  private lcpTime: number | null = null;
  private inpEvents = new Map<number, boolean>();

  /**
   * Initialize TanStack Query monitoring
   * Works with both React Query and Vue Query
   * 
   * @param queryClient - The QueryClient instance from @tanstack/react-query or @tanstack/vue-query
   */
  public initialize(queryClient: GenericQueryClient): void {
    if (this.initialized) {
      console.warn('TanStackQueryMonitor already initialized');
      return;
    }

    this.queryClient = queryClient;

    // Subscribe to query cache changes
    const queryCache = queryClient.getQueryCache();
    
    this.unsubscribe = queryCache.subscribe((event: any) => {
      this.handleQueryEvent(event);
    });

    // Snapshot current queries
    this.snapshotCurrentQueries();

    this.initialized = true;
    console.info('TanStackQueryMonitor initialized');
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
   * Register a callback for query events
   */
  public onQuery(callback: QueryCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all query metrics
   */
  public getQueryMetrics(): QueryCacheMetric[] {
    return [...this.queryMetrics];
  }

  /**
   * Get query cache statistics
   */
  public getQueryCacheStats(): QueryCacheStats {
    const allQueries = this.queryMetrics;
    
    const totalQueries = allQueries.length;
    const activeQueries = allQueries.filter(q => q.fetchStatus === 'fetching').length;
    const staleQueries = allQueries.filter(q => {
      const now = Date.now();
      return q.dataUpdatedAt > 0 && (now - q.dataUpdatedAt) > q.staleTime;
    }).length;
    const erroredQueries = allQueries.filter(q => q.status === 'error').length;

    const queriesWithDuration = allQueries.filter(q => q.fetchDuration !== undefined);
    const averageFetchDuration = queriesWithDuration.length > 0
      ? queriesWithDuration.reduce((sum, q) => sum + (q.fetchDuration || 0), 0) / queriesWithDuration.length
      : 0;

    // Calculate cache hit rate
    const totalExecutions = Array.from(this.queryExecutions.values())
      .reduce((sum, stat) => sum + stat.count, 0);
    const cacheHitRate = totalExecutions > 0
      ? (totalExecutions - totalQueries) / totalExecutions
      : 0;

    // Get slowest queries
    const slowestQueries = [...allQueries]
      .filter(q => q.fetchDuration !== undefined)
      .sort((a, b) => (b.fetchDuration || 0) - (a.fetchDuration || 0))
      .slice(0, 10);

    // Get most frequent queries
    const mostFrequentQueries = Array.from(this.queryExecutions.entries())
      .map(([queryKey, stats]) => ({ queryKey, count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries,
      activeQueries,
      staleQueries,
      erroredQueries,
      averageFetchDuration,
      cacheHitRate,
      slowestQueries,
      mostFrequentQueries,
    };
  }

  /**
   * Clear all collected metrics
   */
  public clear(): void {
    this.queryMetrics = [];
    this.queryExecutions.clear();
  }

  /**
   * Disconnect from query cache
   */
  public disconnect(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.initialized = false;
  }

  // Private methods

  private handleQueryEvent(event: any): void {
    const { type, query } = event;

    // Only track fetch events
    if (type !== 'updated') return;
    if (!query) return;

    const queryKey = this.serializeQueryKey(query.queryKey);
    const startTime = (query as any)._fetchStartTime || Date.now();
    const fetchDuration = query.state.dataUpdatedAt > 0 
      ? Date.now() - startTime 
      : undefined;

    // Track execution count
    const existing = this.queryExecutions.get(queryKey) || { count: 0, totalDuration: 0 };
    this.queryExecutions.set(queryKey, {
      count: existing.count + 1,
      totalDuration: existing.totalDuration + (fetchDuration || 0),
    });

    const metric: QueryCacheMetric = {
      queryKey,
      status: query.state.status,
      fetchStatus: query.state.fetchStatus,
      dataUpdatedAt: query.state.dataUpdatedAt,
      errorUpdatedAt: query.state.errorUpdatedAt,
      fetchDuration,
      cacheTime: query.cacheTime || 300000, // Default 5 minutes
      staleTime: query.options?.staleTime || 0,
      blockedLCP: this.checkLCPBlocking(startTime, fetchDuration || 0),
      blockedINP: this.checkINPBlocking(startTime, fetchDuration || 0),
    };

    this.queryMetrics.push(metric);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error in query callback:', error);
      }
    });

    // Log slow queries
    if (fetchDuration && fetchDuration > 1000) {
      console.warn('[TanStack Query] Slow query detected:', {
        queryKey,
        duration: `${fetchDuration.toFixed(2)}ms`,
        status: metric.status,
        blockedLCP: metric.blockedLCP,
        blockedINP: metric.blockedINP,
      });
    }
  }

  private snapshotCurrentQueries(): void {
    if (!this.queryClient) return;

    const queryCache = this.queryClient.getQueryCache();
    const queries = queryCache.getAll();

    queries.forEach(query => {
      const queryKey = this.serializeQueryKey(query.queryKey);
      
      const metric: QueryCacheMetric = {
        queryKey,
        status: query.state.status,
        fetchStatus: query.state.fetchStatus,
        dataUpdatedAt: query.state.dataUpdatedAt,
        errorUpdatedAt: query.state.errorUpdatedAt,
        cacheTime: query.cacheTime || 300000,
        staleTime: query.options?.staleTime || 0,
      };

      this.queryMetrics.push(metric);
    });
  }

  private serializeQueryKey(queryKey: any): string {
    if (typeof queryKey === 'string') return queryKey;
    if (Array.isArray(queryKey)) return JSON.stringify(queryKey);
    return String(queryKey);
  }

  private checkLCPBlocking(startTime: number, duration: number): boolean {
    if (this.lcpTime === null) return false;
    
    const endTime = startTime + duration;
    return startTime < this.lcpTime && endTime > this.lcpTime;
  }

  private checkINPBlocking(startTime: number, duration: number): boolean {
    const endTime = startTime + duration;
    
    for (const [inpTime] of this.inpEvents) {
      if (startTime < inpTime && endTime > inpTime) {
        return true;
      }
    }
    
    return false;
  }

  private correlateWithLCP(): void {
    if (this.lcpTime === null) return;

    this.queryMetrics.forEach(metric => {
      if (metric.fetchDuration && !metric.blockedLCP) {
        metric.blockedLCP = this.checkLCPBlocking(
          metric.dataUpdatedAt - metric.fetchDuration,
          metric.fetchDuration
        );
      }
    });
  }

  private correlateWithINP(): void {
    this.queryMetrics.forEach(metric => {
      if (metric.fetchDuration && !metric.blockedINP) {
        metric.blockedINP = this.checkINPBlocking(
          metric.dataUpdatedAt - metric.fetchDuration,
          metric.fetchDuration
        );
      }
    });
  }
}

// Singleton instance
let instance: TanStackQueryMonitor | null = null;

export function getTanStackQueryMonitor(): TanStackQueryMonitor {
  if (!instance) {
    instance = new TanStackQueryMonitor();
  }
  return instance;
}