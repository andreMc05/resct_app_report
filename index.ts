/**
 * Performance Monitoring Integration
 * 
 * Framework-agnostic entry point - works with React, Vue, or any JS framework
 * Orchestrates all monitoring components and provides a unified API
 */

import { getWebVitalsMonitor } from './core/WebVitalsMonitor';
import { getResourceTimingMonitor } from './core/ResourceTimingMonitor';
import { getLoAFMonitor } from './core/LoAFMonitor';
import { getAPICorrelationMonitor } from './core/APICorrelationMonitor';
import { getTanStackQueryMonitor } from './core/TanStackQueryMonitor';
import { getMarkdownReporter } from './reporters/MarkdownReporter';

import {
  PerformanceSession,
  NavigationMetric,
  HydrationMetric,
  ReportOptions,
  EnhancedWebVitalsMetric,
} from './types/monitoring.types';

export class PerformanceMonitor {
  private sessionId: string;
  private sessionStartTime: number;
  private framework: 'react' | 'vue' | 'other' = 'other';
  
  private webVitalsMonitor = getWebVitalsMonitor();
  private resourceMonitor = getResourceTimingMonitor();
  private loafMonitor = getLoAFMonitor();
  private apiMonitor = getAPICorrelationMonitor();
  private queryMonitor = getTanStackQueryMonitor();
  private reporter = getMarkdownReporter();
  
  private hydrationStartTime: number | null = null;
  private hydrationMetric: HydrationMetric | null = null;
  private queryClientInitialized = false;

  constructor(framework: 'react' | 'vue' | 'other' = 'other') {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.framework = framework;
  }

  /**
   * Initialize all monitoring systems
   * Call this early in your app's lifecycle
   */
  public initialize(): void {
    console.info(`[PerformanceMonitor] Initializing for ${this.framework}...`);

    // Initialize all monitors
    this.webVitalsMonitor.initialize();
    this.resourceMonitor.initialize();
    this.loafMonitor.initialize();
    this.apiMonitor.initialize();

    // Set up correlations
    this.setupCorrelations();

    console.info('[PerformanceMonitor] Initialized successfully');
  }

  /**
   * Initialize TanStack Query monitoring
   * Works with both @tanstack/react-query and @tanstack/vue-query
   * 
   * @param queryClient - The QueryClient instance
   */
  public initializeQueryClient(queryClient: any): void {
    if (this.queryClientInitialized) {
      console.warn('[PerformanceMonitor] Query client already initialized');
      return;
    }

    this.queryMonitor.initialize(queryClient);
    this.setupQueryCorrelations();
    this.queryClientInitialized = true;

    console.info('[PerformanceMonitor] TanStack Query monitoring initialized');
  }

  /**
   * Mark the start of framework hydration
   * Call this before hydration begins (React, Vue, etc.)
   */
  public markHydrationStart(): void {
    this.hydrationStartTime = performance.now();
    console.info(`[PerformanceMonitor] ${this.framework} hydration start marked`);
  }

  /**
   * Mark the end of framework hydration
   * Call this after hydration completes
   */
  public markHydrationEnd(componentCount?: number): void {
    if (this.hydrationStartTime === null) {
      console.warn('[PerformanceMonitor] markHydrationEnd called without markHydrationStart');
      return;
    }

    const endTime = performance.now();
    const duration = endTime - this.hydrationStartTime;

    // Get LCP values before and after hydration
    const lcpMetric = this.webVitalsMonitor.getLatestMetric('LCP');
    
    this.hydrationMetric = {
      startTime: this.hydrationStartTime,
      endTime,
      duration,
      componentsHydrated: componentCount || 0,
      framework: this.framework,
      lcpBeforeHydration: lcpMetric && lcpMetric.timestamp < endTime ? lcpMetric.value : undefined,
      lcpAfterHydration: lcpMetric && lcpMetric.timestamp >= endTime ? lcpMetric.value : undefined,
      lcpElement: lcpMetric?.attribution ? (lcpMetric.attribution as any).element : undefined,
    };

    console.info(`[PerformanceMonitor] ${this.framework} hydration completed:`, {
      duration: `${duration.toFixed(2)}ms`,
      components: componentCount,
    });
  }

  /**
   * Generate a complete performance report
   */
  public generateReport(options?: ReportOptions): string {
    const session = this.getPerformanceSession();
    return this.reporter.generateReport(session, options);
  }

  /**
   * Download performance report as markdown file
   */
  public downloadReport(options?: ReportOptions): void {
    const session = this.getPerformanceSession();
    this.reporter.downloadReport(session, options);
  }

  /**
   * Get the complete performance session data
   */
  public getPerformanceSession(): PerformanceSession {
    const webVitals = this.webVitalsMonitor.getMetrics();
    const resources = this.resourceMonitor.getResources();
    const longFrames = this.loafMonitor.getFrames();
    const apiCalls = this.apiMonitor.getAPICalls();
    const navigation = this.getNavigationMetric();
    const queryCache = this.queryClientInitialized ? this.queryMonitor.getQueryCacheStats() : undefined;

    // Calculate summary
    const summary = {
      totalResources: resources.length,
      blockingResources: this.resourceMonitor.getBlockingResources().length,
      totalTransferSize: this.resourceMonitor.getTotalTransferSize(),
      averageCompressionRatio: this.resourceMonitor.getAverageCompressionRatio(),
      apiCallCount: apiCalls.length,
      averageApiLatency: this.apiMonitor.getAverageLatency(),
      longFrameCount: longFrames.length,
      totalBlockingTime: this.loafMonitor.getTotalBlockingTime(),
      
      // TanStack Query stats
      queryCount: queryCache?.totalQueries,
      queryCacheHitRate: queryCache?.cacheHitRate,
      averageQueryDuration: queryCache?.averageFetchDuration,
    };

    return {
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: this.sessionStartTime,
      userAgent: navigator.userAgent,
      framework: this.framework,
      webVitals,
      navigation,
      hydration: this.hydrationMetric,
      resources,
      longFrames,
      apiCalls,
      queryCache,
      summary,
    };
  }

  /**
   * Send performance data to an analytics endpoint
   */
  public async sendToAnalytics(endpoint: string): Promise<void> {
    const session = this.getPerformanceSession();
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });
      
      console.info('[PerformanceMonitor] Data sent to analytics');
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to send analytics:', error);
    }
  }

  /**
   * Clear all collected metrics
   */
  public clear(): void {
    this.webVitalsMonitor.clear();
    this.resourceMonitor.clear();
    this.loafMonitor.clear();
    this.apiMonitor.clear();
    if (this.queryClientInitialized) {
      this.queryMonitor.clear();
    }
    this.hydrationMetric = null;
    this.hydrationStartTime = null;
  }

  // Private methods

  private setupCorrelations(): void {
    // When Web Vitals are captured, update API correlation
    this.webVitalsMonitor.onMetric((metric: EnhancedWebVitalsMetric) => {
      if (metric.name === 'LCP') {
        this.apiMonitor.setLCPTime(metric.value);
        if (this.queryClientInitialized) {
          this.queryMonitor.setLCPTime(metric.value);
        }
      }
      
      if (metric.name === 'INP') {
        this.apiMonitor.recordINPEvent(metric.value);
        if (this.queryClientInitialized) {
          this.queryMonitor.recordINPEvent(metric.value);
        }
      }
    });
  }

  private setupQueryCorrelations(): void {
    // Additional query-specific correlations if needed
    this.queryMonitor.onQuery((queryMetric) => {
      // Log queries that impact performance
      if (queryMetric.blockedLCP || queryMetric.blockedINP) {
        console.info('[TanStack Query] Performance-impacting query:', queryMetric);
      }
    });
  }

  private getNavigationMetric(): NavigationMetric | null {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navTiming) return null;

    return {
      navigationType: navTiming.type as NavigationMetric['navigationType'],
      domainLookupStart: navTiming.domainLookupStart,
      domainLookupEnd: navTiming.domainLookupEnd,
      connectStart: navTiming.connectStart,
      connectEnd: navTiming.connectEnd,
      requestStart: navTiming.requestStart,
      responseStart: navTiming.responseStart,
      responseEnd: navTiming.responseEnd,
      domInteractive: navTiming.domInteractive,
      domContentLoadedEventStart: navTiming.domContentLoadedEventStart,
      domContentLoadedEventEnd: navTiming.domContentLoadedEventEnd,
      domComplete: navTiming.domComplete,
      loadEventStart: navTiming.loadEventStart,
      loadEventEnd: navTiming.loadEventEnd,
      
      // Derived metrics
      dnsTime: navTiming.domainLookupEnd - navTiming.domainLookupStart,
      tcpTime: navTiming.connectEnd - navTiming.connectStart,
      ttfb: navTiming.responseStart - navTiming.requestStart,
      downloadTime: navTiming.responseEnd - navTiming.responseStart,
      domProcessingTime: navTiming.domComplete - navTiming.domInteractive,
      pageLoadTime: navTiming.loadEventEnd - navTiming.fetchStart,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instances per framework
const instances = new Map<string, PerformanceMonitor>();

/**
 * Get the PerformanceMonitor instance for a specific framework
 */
export function getPerformanceMonitor(framework: 'react' | 'vue' | 'other' = 'other'): PerformanceMonitor {
  if (!instances.has(framework)) {
    instances.set(framework, new PerformanceMonitor(framework));
  }
  return instances.get(framework)!;
}

/**
 * Initialize performance monitoring for React
 */
export function initializeReactMonitoring(): PerformanceMonitor {
  const monitor = getPerformanceMonitor('react');
  monitor.initialize();
  return monitor;
}

/**
 * Initialize performance monitoring for Vue
 */
export function initializeVueMonitoring(): PerformanceMonitor {
  const monitor = getPerformanceMonitor('vue');
  monitor.initialize();
  return monitor;
}

/**
 * Initialize generic performance monitoring
 */
export function initializePerformanceMonitoring(framework: 'react' | 'vue' | 'other' = 'other'): PerformanceMonitor {
  const monitor = getPerformanceMonitor(framework);
  monitor.initialize();
  return monitor;
}

// Export all types and utilities
export * from './types/monitoring.types';
export { getMarkdownReporter } from './reporters/MarkdownReporter';
export { getTanStackQueryMonitor } from './core/TanStackQueryMonitor';