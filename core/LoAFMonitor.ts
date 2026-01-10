/**
 * Long Animation Frames (LoAF) Monitor
 * 
 * Uses the Long Animation Frames API
 * Spec: https://w3c.github.io/long-animation-frames/
 * 
 * Tracks long-running tasks that block the main thread
 * Critical for understanding INP issues
 */

import { LongAnimationFrameEntry } from '../types/monitoring.types';

type LoAFCallback = (frame: LongAnimationFrameEntry) => void;

export class LoAFMonitor {
  private frames: LongAnimationFrameEntry[] = [];
  private callbacks: LoAFCallback[] = [];
  private observer: PerformanceObserver | null = null;
  private initialized = false;

  /**
   * Initialize Long Animation Frame monitoring
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('LoAFMonitor already initialized');
      return;
    }

    // Check for PerformanceObserver support
    if (!('PerformanceObserver' in window)) {
      console.error('PerformanceObserver not supported');
      return;
    }

    try {
      // Check if long-animation-frame is supported
      if (!PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
        console.warn('long-animation-frame API not supported in this browser');
        // Fallback to long-task monitoring
        this.initializeLongTaskFallback();
        return;
      }

      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLoAFEntry(entry as any); // PerformanceLongAnimationFrameTiming
        }
      });

      this.observer.observe({
        type: 'long-animation-frame',
        buffered: true
      });

      this.initialized = true;
      console.info('LoAFMonitor initialized with long-animation-frame API');
    } catch (error) {
      console.error('Failed to initialize LoAFMonitor:', error);
      this.initializeLongTaskFallback();
    }
  }

  /**
   * Fallback to long-task API for browsers without LoAF support
   */
  private initializeLongTaskFallback(): void {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        console.warn('longtask API also not supported');
        return;
      }

      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLongTaskEntry(entry as PerformanceEntry);
        }
      });

      this.observer.observe({
        type: 'longtask',
        buffered: true
      });

      this.initialized = true;
      console.info('LoAFMonitor initialized with longtask API (fallback)');
    } catch (error) {
      console.error('Failed to initialize longtask fallback:', error);
    }
  }

  /**
   * Register a callback for new long animation frames
   */
  public onLongFrame(callback: LoAFCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all collected long animation frames
   */
  public getFrames(): LongAnimationFrameEntry[] {
    return [...this.frames];
  }

  /**
   * Get frames longer than a threshold (default 50ms)
   */
  public getFramesAboveThreshold(thresholdMs: number = 50): LongAnimationFrameEntry[] {
    return this.frames.filter(f => f.duration >= thresholdMs);
  }

  /**
   * Get total blocking time
   */
  public getTotalBlockingTime(): number {
    // TBT = sum of (duration - 50ms) for all long tasks
    return this.frames.reduce((sum, frame) => {
      const blockingTime = Math.max(0, frame.duration - 50);
      return sum + blockingTime;
    }, 0);
  }

  /**
   * Get frames with specific script attribution
   */
  public getFramesByScript(scriptUrl: string): LongAnimationFrameEntry[] {
    return this.frames.filter(frame =>
      frame.scripts.some(script => script.sourceURL.includes(scriptUrl))
    );
  }

  /**
   * Get the worst offending scripts
   */
  public getWorstScripts(count: number = 10): Array<{ url: string; totalDuration: number; count: number }> {
    const scriptMap = new Map<string, { totalDuration: number; count: number }>();

    this.frames.forEach(frame => {
      frame.scripts.forEach(script => {
        const url = script.sourceURL || 'unknown';
        const existing = scriptMap.get(url) || { totalDuration: 0, count: 0 };
        scriptMap.set(url, {
          totalDuration: existing.totalDuration + script.duration,
          count: existing.count + 1,
        });
      });
    });

    return Array.from(scriptMap.entries())
      .map(([url, stats]) => ({ url, ...stats }))
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, count);
  }

  /**
   * Clear all collected frames
   */
  public clear(): void {
    this.frames = [];
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

  private handleLoAFEntry(entry: any): void {
    // Convert PerformanceLongAnimationFrameTiming to our type
    const frame: LongAnimationFrameEntry = {
      name: entry.name || 'long-animation-frame',
      entryType: 'long-animation-frame',
      startTime: entry.startTime,
      duration: entry.duration,
      renderStart: entry.renderStart || 0,
      styleAndLayoutStart: entry.styleAndLayoutStart || 0,
      firstUIEventTimestamp: entry.firstUIEventTimestamp || 0,
      blockingDuration: entry.blockingDuration || 0,
      scripts: this.extractScripts(entry),
    };

    this.frames.push(frame);
    this.notifyCallbacks(frame);
  }

  private handleLongTaskEntry(entry: PerformanceEntry): void {
    // Convert longtask entry to our format (with limited data)
    const frame: LongAnimationFrameEntry = {
      name: entry.name,
      entryType: 'long-animation-frame',
      startTime: entry.startTime,
      duration: entry.duration,
      renderStart: 0,
      styleAndLayoutStart: 0,
      firstUIEventTimestamp: 0,
      blockingDuration: Math.max(0, entry.duration - 50),
      scripts: [{
        invoker: 'unknown',
        invokerType: 'unknown',
        sourceURL: 'unknown (longtask fallback)',
        sourceFunctionName: 'unknown',
        sourceCharPosition: 0,
        executionStart: entry.startTime,
        duration: entry.duration,
        forcedStyleAndLayoutDuration: 0,
      }],
    };

    this.frames.push(frame);
    this.notifyCallbacks(frame);
  }

  private extractScripts(entry: any): LongAnimationFrameEntry['scripts'] {
    if (!entry.scripts || !Array.isArray(entry.scripts)) {
      return [];
    }

    return entry.scripts.map((script: any) => ({
      invoker: script.invoker || 'unknown',
      invokerType: script.invokerType || 'unknown',
      sourceURL: script.sourceURL || script.sourceLocation || 'unknown',
      sourceFunctionName: script.sourceFunctionName || 'anonymous',
      sourceCharPosition: script.sourceCharPosition || 0,
      executionStart: script.executionStart || 0,
      duration: script.duration || 0,
      forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration || 0,
    }));
  }

  private notifyCallbacks(frame: LongAnimationFrameEntry): void {
    this.callbacks.forEach(callback => {
      try {
        callback(frame);
      } catch (error) {
        console.error('Error in LoAF callback:', error);
      }
    });

    // Log significant frames
    if (frame.duration > 100) {
      console.warn('[LoAF] Long animation frame detected:', {
        duration: `${frame.duration.toFixed(2)}ms`,
        blockingDuration: `${frame.blockingDuration.toFixed(2)}ms`,
        scripts: frame.scripts.map(s => s.sourceURL),
      });
    }
  }
}

// Singleton instance
let instance: LoAFMonitor | null = null;

export function getLoAFMonitor(): LoAFMonitor {
  if (!instance) {
    instance = new LoAFMonitor();
  }
  return instance;
}