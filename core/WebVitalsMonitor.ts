/**
 * Core Web Vitals Monitor
 * 
 * Uses the web-vitals library (https://github.com/GoogleChrome/web-vitals)
 * Based on official Chrome metrics and W3C specifications
 * 
 * Install: npm install web-vitals
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric, CLSMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution } from 'web-vitals/attribution';
import { EnhancedWebVitalsMetric, WebVitalsMetric, LCPAttribution, CLSAttribution, INPAttribution } from '../types/monitoring.types';

type MetricCallback = (metric: EnhancedWebVitalsMetric) => void;

export class WebVitalsMonitor {
  private metrics: EnhancedWebVitalsMetric[] = [];
  private callbacks: MetricCallback[] = [];
  private initialized = false;

  /**
   * Initialize Core Web Vitals monitoring
   * Automatically starts collecting metrics
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('WebVitalsMonitor already initialized');
      return;
    }

    // LCP - Largest Contentful Paint
    onLCP(this.handleLCP.bind(this), { reportAllChanges: true });

    // CLS - Cumulative Layout Shift
    onCLS(this.handleCLS.bind(this), { reportAllChanges: true });

    // INP - Interaction to Next Paint (replaces FID)
    onINP(this.handleINP.bind(this), { reportAllChanges: true });

    // FCP - First Contentful Paint
    onFCP(this.handleFCP.bind(this), { reportAllChanges: true });

    // TTFB - Time to First Byte
    onTTFB(this.handleTTFB.bind(this), { reportAllChanges: true });

    this.initialized = true;
    console.info('WebVitalsMonitor initialized');
  }

  /**
   * Register a callback for new metrics
   */
  public onMetric(callback: MetricCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all collected metrics
   */
  public getMetrics(): EnhancedWebVitalsMetric[] {
    return [...this.metrics];
  }

  /**
   * Get the latest value for a specific metric
   */
  public getLatestMetric(name: WebVitalsMetric['name']): EnhancedWebVitalsMetric | null {
    const filtered = this.metrics.filter(m => m.name === name);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  /**
   * Clear all collected metrics
   */
  public clear(): void {
    this.metrics = [];
  }

  // Private handlers for each metric

  private handleLCP(metric: LCPMetricWithAttribution): void {
    const enhanced: EnhancedWebVitalsMetric = {
      ...this.baseMetricData(metric),
      attribution: this.extractLCPAttribution(metric),
    };

    this.storeMetric(enhanced);
  }

  private handleCLS(metric: CLSMetricWithAttribution): void {
    const enhanced: EnhancedWebVitalsMetric = {
      ...this.baseMetricData(metric),
      attribution: this.extractCLSAttribution(metric),
    };

    this.storeMetric(enhanced);
  }

  private handleINP(metric: INPMetricWithAttribution): void {
    const enhanced: EnhancedWebVitalsMetric = {
      ...this.baseMetricData(metric),
      attribution: this.extractINPAttribution(metric),
    };

    this.storeMetric(enhanced);
  }

  private handleFCP(metric: Metric): void {
    const enhanced: EnhancedWebVitalsMetric = this.baseMetricData(metric);
    this.storeMetric(enhanced);
  }

  private handleTTFB(metric: Metric): void {
    const enhanced: EnhancedWebVitalsMetric = this.baseMetricData(metric);
    this.storeMetric(enhanced);
  }

  // Attribution extraction methods

  private extractLCPAttribution(metric: LCPMetricWithAttribution): LCPAttribution | undefined {
    if (!metric.attribution) return undefined;

    const attr = metric.attribution;
    
    return {
      element: attr.element ? this.getElementSelector(attr.element as unknown as Element) : undefined,
      url: attr.url || undefined,
      timeToFirstByte: attr.timeToFirstByte || 0,
      resourceLoadDelay: attr.resourceLoadDelay || 0,
      resourceLoadDuration: (attr as any).resourceLoadDuration || (attr as any).resourceLoadTime || 0,
      elementRenderDelay: attr.elementRenderDelay || 0,
    };
  }

  private extractCLSAttribution(metric: CLSMetricWithAttribution): CLSAttribution | undefined {
    if (!metric.attribution) return undefined;

    const attr = metric.attribution;
    
    return {
      largestShiftTarget: attr.largestShiftTarget ? this.getElementSelector(attr.largestShiftTarget as unknown as Element) : undefined,
      largestShiftValue: attr.largestShiftValue || 0,
      largestShiftTime: attr.largestShiftTime || 0,
      loadState: attr.loadState as CLSAttribution['loadState'],
    };
  }

  private extractINPAttribution(metric: INPMetricWithAttribution): INPAttribution | undefined {
    if (!metric.attribution) return undefined;

    const attr = metric.attribution as any;
    
    return {
      // Support both old and new property names from web-vitals
      interactionTarget: attr.interactionTarget ? this.getElementSelector(attr.interactionTarget as unknown as Element) : undefined,
      eventTarget: attr.eventTarget ? this.getElementSelector(attr.eventTarget as unknown as Element) : undefined,
      interactionType: attr.interactionType || undefined,
      eventType: attr.eventType || undefined,
      interactionTime: attr.interactionTime || undefined,
      eventTime: attr.eventTime || undefined,
      processingStart: attr.processingStart || undefined,
      processingEnd: attr.processingEnd || undefined,
      presentationTime: attr.presentationTime || undefined,
      inputDelay: attr.inputDelay || undefined,
      processingDuration: attr.processingDuration || undefined,
      presentationDelay: attr.presentationDelay || undefined,
    };
  }

  // Utility methods

  private baseMetricData(metric: Metric): EnhancedWebVitalsMetric {
    return {
      name: metric.name as WebVitalsMetric['name'],
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType as WebVitalsMetric['navigationType'],
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private getElementSelector(element: Element): string {
    // Build a useful selector for the element
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    
    return `${tagName}${id}${classes}`.substring(0, 100);
  }

  private storeMetric(metric: EnhancedWebVitalsMetric): void {
    this.metrics.push(metric);
    
    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error in metric callback:', error);
      }
    });

    // Also log to console for debugging
    console.info(`[WebVitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      attribution: metric.attribution,
    });
  }
}

// Singleton instance
let instance: WebVitalsMonitor | null = null;

export function getWebVitalsMonitor(): WebVitalsMonitor {
  if (!instance) {
    instance = new WebVitalsMonitor();
  }
  return instance;
}