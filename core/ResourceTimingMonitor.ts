/**
 * Resource Timing Monitor
 * 
 * Uses the Performance Timeline API and PerformanceObserver
 * Spec: https://w3c.github.io/resource-timing/
 * 
 * Tracks all resource loads with detailed timing breakdowns
 */

import { ResourceTimingEntry } from '../types/monitoring.types';

type ResourceCallback = (resource: ResourceTimingEntry) => void;

export class ResourceTimingMonitor {
  private resources: ResourceTimingEntry[] = [];
  private callbacks: ResourceCallback[] = [];
  private observer: PerformanceObserver | null = null;
  private initialized = false;

  /**
   * Initialize resource timing monitoring
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('ResourceTimingMonitor already initialized');
      return;
    }

    // Check for PerformanceObserver support
    if (!('PerformanceObserver' in window)) {
      console.error('PerformanceObserver not supported');
      return;
    }

    // Observe resource timing entries
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.handleResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      this.observer.observe({ 
        type: 'resource',
        buffered: true // Include entries from before observation started
      });

      this.initialized = true;
      console.info('ResourceTimingMonitor initialized');
    } catch (error) {
      console.error('Failed to initialize ResourceTimingMonitor:', error);
    }
  }

  /**
   * Register a callback for new resource entries
   */
  public onResource(callback: ResourceCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all collected resource entries
   */
  public getResources(): ResourceTimingEntry[] {
    return [...this.resources];
  }

  /**
   * Get resources filtered by type
   */
  public getResourcesByType(type: string): ResourceTimingEntry[] {
    return this.resources.filter(r => r.initiatorType === type);
  }

  /**
   * Get render-blocking resources
   */
  public getBlockingResources(): ResourceTimingEntry[] {
    return this.resources.filter(r => r.renderBlockingStatus === 'blocking');
  }

  /**
   * Get resources by size (sorted descending)
   */
  public getLargestResources(count: number = 10): ResourceTimingEntry[] {
    return [...this.resources]
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, count);
  }

  /**
   * Get slowest resources by duration
   */
  public getSlowestResources(count: number = 10): ResourceTimingEntry[] {
    return [...this.resources]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  /**
   * Get total transfer size
   */
  public getTotalTransferSize(): number {
    return this.resources.reduce((sum, r) => sum + r.transferSize, 0);
  }

  /**
   * Get average compression ratio
   */
  public getAverageCompressionRatio(): number {
    const ratios = this.resources
      .map(r => r.compressionRatio)
      .filter((r): r is number => r !== undefined && r > 0);
    
    if (ratios.length === 0) return 0;
    
    return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  }

  /**
   * Clear all collected resources
   */
  public clear(): void {
    this.resources = [];
  }

  /**
   * Disconnect the observer
   */
  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.initialized = false;
    }
  }

  // Private methods

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const resource = this.convertToResourceTiming(entry);
    this.resources.push(resource);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(resource);
      } catch (error) {
        console.error('Error in resource callback:', error);
      }
    });
  }

  private convertToResourceTiming(entry: PerformanceResourceTiming): ResourceTimingEntry {
    // Calculate compression ratio
    const compressionRatio = entry.encodedBodySize > 0
      ? entry.decodedBodySize / entry.encodedBodySize
      : undefined;

    // Determine render blocking status
    const renderBlockingStatus = this.getRenderBlockingStatus(entry);

    return {
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      initiatorType: entry.initiatorType,
      nextHopProtocol: entry.nextHopProtocol,
      renderBlockingStatus,

      // Detailed timing
      fetchStart: entry.fetchStart,
      domainLookupStart: entry.domainLookupStart,
      domainLookupEnd: entry.domainLookupEnd,
      connectStart: entry.connectStart,
      connectEnd: entry.connectEnd,
      secureConnectionStart: entry.secureConnectionStart,
      requestStart: entry.requestStart,
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,

      // Size information
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,

      compressionRatio,
    };
  }

  private getRenderBlockingStatus(entry: PerformanceResourceTiming): 'blocking' | 'non-blocking' {
    // Check if the resource has renderBlockingStatus property (newer browsers)
    if ('renderBlockingStatus' in entry) {
      return (entry as any).renderBlockingStatus === 'blocking' ? 'blocking' : 'non-blocking';
    }

    // Fallback: heuristic-based detection
    // Resources that are likely render-blocking:
    const isStylesheet = entry.initiatorType === 'link' && entry.name.includes('.css');
    const isBlockingScript = entry.initiatorType === 'script' && !entry.name.includes('async') && !entry.name.includes('defer');
    const isFont = entry.initiatorType === 'css' || entry.name.match(/\.(woff2?|ttf|otf|eot)$/);

    // If loaded early in the page lifecycle, more likely to be blocking
    const isEarlyLoad = entry.startTime < 1000;

    if ((isStylesheet || isBlockingScript || isFont) && isEarlyLoad) {
      return 'blocking';
    }

    return 'non-blocking';
  }
}

// Singleton instance
let instance: ResourceTimingMonitor | null = null;

export function getResourceTimingMonitor(): ResourceTimingMonitor {
  if (!instance) {
    instance = new ResourceTimingMonitor();
  }
  return instance;
}