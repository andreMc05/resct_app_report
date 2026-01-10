/**
 * Core Type Definitions for Performance Monitoring
 * 
 * Framework-agnostic types used across all monitors
 */

// ============================================
// Web Vitals Types
// ============================================

export interface WebVitalsMetric {
  name: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

export interface EnhancedWebVitalsMetric extends WebVitalsMetric {
  timestamp: number;
  url: string;
  userAgent: string;
  attribution?: LCPAttribution | CLSAttribution | INPAttribution;
}

export interface LCPAttribution {
  element?: string;
  url?: string;
  timeToFirstByte: number;
  resourceLoadDelay: number;
  resourceLoadDuration?: number;
  resourceLoadTime?: number;
  elementRenderDelay: number;
}

export interface CLSAttribution {
  largestShiftTarget?: string;
  largestShiftValue: number;
  largestShiftTime: number;
  loadState: 'loading' | 'dom-interactive' | 'dom-content-loaded' | 'complete';
}

export interface INPAttribution {
  interactionTarget?: string;
  eventTarget?: string;
  interactionType?: string;
  eventType?: string;
  interactionTime?: number;
  eventTime?: number;
  inputDelay?: number;
  processingStart?: number;
  processingDuration?: number;
  processingEnd?: number;
  presentationDelay?: number;
  presentationTime?: number;
}

// ============================================
// Navigation Types
// ============================================

export interface NavigationMetric {
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;
  
  // Derived metrics
  dnsTime: number;
  tcpTime: number;
  ttfb: number;
  downloadTime: number;
  domProcessingTime: number;
  pageLoadTime: number;
}

// ============================================
// Hydration Types
// ============================================

export interface HydrationMetric {
  startTime: number;
  endTime: number;
  duration: number;
  componentsHydrated: number;
  framework: 'react' | 'vue' | 'other';
  lcpBeforeHydration?: number;
  lcpAfterHydration?: number;
  lcpElement?: string;
}

// ============================================
// Resource Timing Types
// ============================================

export interface ResourceTimingEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  initiatorType: string;
  nextHopProtocol: string;
  renderBlockingStatus: 'blocking' | 'non-blocking';
  
  // Detailed timing
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  
  // Size information
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  
  compressionRatio?: number;
}

// ============================================
// Long Animation Frames (LoAF) Types
// ============================================

export interface LongAnimationFrameEntry {
  name: string;
  entryType: 'long-animation-frame';
  startTime: number;
  duration: number;
  renderStart: number;
  styleAndLayoutStart: number;
  firstUIEventTimestamp: number;
  blockingDuration: number;
  scripts: ScriptAttribution[];
}

export interface ScriptAttribution {
  invoker: string;
  invokerType: string;
  sourceURL: string;
  sourceFunctionName: string;
  sourceCharPosition: number;
  executionStart: number;
  duration: number;
  forcedStyleAndLayoutDuration: number;
}

// ============================================
// API Correlation Types
// ============================================

export interface APICallMetric {
  url: string;
  method: string;
  startTime: number;
  duration: number;
  ttfb: number;
  status: number;
  size: number;
  blockedLCP?: boolean;
  blockedINP?: boolean;
  associatedMetricId?: string;
}

// ============================================
// TanStack Query Types
// ============================================

export interface QueryCacheMetric {
  queryKey: string;
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  fetchDuration?: number;
  cacheTime: number;
  staleTime: number;
  blockedLCP?: boolean;
  blockedINP?: boolean;
}

export interface QueryCacheStats {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  erroredQueries: number;
  averageFetchDuration: number;
  cacheHitRate: number;
  slowestQueries: QueryCacheMetric[];
  mostFrequentQueries: Array<{ queryKey: string; count: number }>;
}

// ============================================
// Performance Session Types
// ============================================

export interface PerformanceSession {
  sessionId: string;
  url: string;
  timestamp: number;
  userAgent: string;
  framework: 'react' | 'vue' | 'other';
  webVitals: EnhancedWebVitalsMetric[];
  navigation: NavigationMetric | null;
  hydration: HydrationMetric | null;
  resources: ResourceTimingEntry[];
  longFrames: LongAnimationFrameEntry[];
  apiCalls: APICallMetric[];
  queryCache?: QueryCacheStats;
  summary: PerformanceSummary;
}

export interface PerformanceSummary {
  totalResources: number;
  blockingResources: number;
  totalTransferSize: number;
  averageCompressionRatio: number;
  apiCallCount: number;
  averageApiLatency: number;
  longFrameCount: number;
  totalBlockingTime: number;
  queryCount?: number;
  queryCacheHitRate?: number;
  averageQueryDuration?: number;
}

// ============================================
// Report Types
// ============================================

export interface ReportOptions {
  includeResources?: boolean;
  includeLongFrames?: boolean;
  includeApiCalls?: boolean;
  includeQueryCache?: boolean;
  maxResources?: number;
  maxLongFrames?: number;
  maxApiCalls?: number;
  customTitle?: string;
}
