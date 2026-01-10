/**
 * Markdown Report Generator
 * 
 * Generates detailed performance reports in Markdown format
 * Can be downloaded or displayed in UI
 */

import {
  PerformanceSession,
  ReportOptions,
  EnhancedWebVitalsMetric,
  ResourceTimingEntry,
  LongAnimationFrameEntry,
  APICallMetric,
} from '../types/monitoring.types';

export class MarkdownReporter {
  private defaultOptions: ReportOptions = {
    includeResources: true,
    includeLongFrames: true,
    includeApiCalls: true,
    includeQueryCache: true,
    maxResources: 20,
    maxLongFrames: 10,
    maxApiCalls: 20,
  };

  /**
   * Generate a complete performance report in Markdown format
   */
  public generateReport(session: PerformanceSession, options?: ReportOptions): string {
    const opts = { ...this.defaultOptions, ...options };
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(session, opts.customTitle));

    // Summary
    sections.push(this.generateSummary(session));

    // Core Web Vitals
    sections.push(this.generateWebVitals(session.webVitals));

    // Navigation Timing
    if (session.navigation) {
      sections.push(this.generateNavigationTiming(session.navigation));
    }

    // Hydration (if available)
    if (session.hydration) {
      sections.push(this.generateHydration(session.hydration));
    }

    // Resources
    if (opts.includeResources && session.resources.length > 0) {
      sections.push(this.generateResources(session.resources, opts.maxResources!));
    }

    // Long Animation Frames
    if (opts.includeLongFrames && session.longFrames.length > 0) {
      sections.push(this.generateLongFrames(session.longFrames, opts.maxLongFrames!));
    }

    // API Calls
    if (opts.includeApiCalls && session.apiCalls.length > 0) {
      sections.push(this.generateApiCalls(session.apiCalls, opts.maxApiCalls!));
    }

    // Query Cache (TanStack Query)
    if (opts.includeQueryCache && session.queryCache) {
      sections.push(this.generateQueryCache(session.queryCache));
    }

    // Footer
    sections.push(this.generateFooter());

    return sections.join('\n\n');
  }

  /**
   * Download the report as a Markdown file
   */
  public downloadReport(session: PerformanceSession, options?: ReportOptions): void {
    const report = this.generateReport(session, options);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.md`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Private section generators

  private generateHeader(session: PerformanceSession, customTitle?: string): string {
    const title = customTitle || 'Performance Report';
    const date = new Date(session.timestamp).toISOString();
    
    return `# ${title}

**URL:** ${session.url}  
**Date:** ${date}  
**Session ID:** ${session.sessionId}  
**Framework:** ${session.framework}  
**User Agent:** ${session.userAgent}`;
  }

  private generateSummary(session: PerformanceSession): string {
    const s = session.summary;
    
    return `## Summary

| Metric | Value |
|--------|-------|
| Total Resources | ${s.totalResources} |
| Blocking Resources | ${s.blockingResources} |
| Total Transfer Size | ${this.formatBytes(s.totalTransferSize)} |
| Avg Compression Ratio | ${s.averageCompressionRatio.toFixed(2)}x |
| API Call Count | ${s.apiCallCount} |
| Avg API Latency | ${s.averageApiLatency.toFixed(2)}ms |
| Long Frames | ${s.longFrameCount} |
| Total Blocking Time | ${s.totalBlockingTime.toFixed(2)}ms |${
  s.queryCount !== undefined ? `
| Query Count | ${s.queryCount} |
| Cache Hit Rate | ${((s.queryCacheHitRate || 0) * 100).toFixed(1)}% |
| Avg Query Duration | ${(s.averageQueryDuration || 0).toFixed(2)}ms |` : ''
}`;
  }

  private generateWebVitals(metrics: EnhancedWebVitalsMetric[]): string {
    if (metrics.length === 0) {
      return '## Core Web Vitals\n\n_No Web Vitals data collected yet._';
    }

    // Get latest value for each metric
    const latest = new Map<string, EnhancedWebVitalsMetric>();
    metrics.forEach(m => latest.set(m.name, m));

    let content = '## Core Web Vitals\n\n';
    content += '| Metric | Value | Rating | Delta |\n';
    content += '|--------|-------|--------|-------|\n';

    for (const [name, metric] of latest) {
      const value = this.formatMetricValue(name, metric.value);
      const ratingEmoji = this.getRatingEmoji(metric.rating);
      content += `| ${name} | ${value} | ${ratingEmoji} ${metric.rating} | ${metric.delta.toFixed(2)} |\n`;
    }

    // Add attribution details
    for (const [name, metric] of latest) {
      if (metric.attribution) {
        content += `\n### ${name} Attribution\n\n`;
        content += this.formatAttribution(name, metric.attribution);
      }
    }

    return content;
  }

  private generateNavigationTiming(nav: PerformanceSession['navigation']): string {
    if (!nav) return '';

    return `## Navigation Timing

| Phase | Duration |
|-------|----------|
| DNS Lookup | ${nav.dnsTime.toFixed(2)}ms |
| TCP Connection | ${nav.tcpTime.toFixed(2)}ms |
| Time to First Byte | ${nav.ttfb.toFixed(2)}ms |
| Content Download | ${nav.downloadTime.toFixed(2)}ms |
| DOM Processing | ${nav.domProcessingTime.toFixed(2)}ms |
| **Page Load Time** | **${nav.pageLoadTime.toFixed(2)}ms** |

### Detailed Timings

- **DOM Interactive:** ${nav.domInteractive.toFixed(2)}ms
- **DOM Content Loaded:** ${nav.domContentLoadedEventEnd.toFixed(2)}ms
- **DOM Complete:** ${nav.domComplete.toFixed(2)}ms`;
  }

  private generateHydration(hydration: PerformanceSession['hydration']): string {
    if (!hydration) return '';

    return `## Framework Hydration

| Metric | Value |
|--------|-------|
| Framework | ${hydration.framework} |
| Duration | ${hydration.duration.toFixed(2)}ms |
| Components Hydrated | ${hydration.componentsHydrated} |
| Start Time | ${hydration.startTime.toFixed(2)}ms |
| End Time | ${hydration.endTime.toFixed(2)}ms |${
  hydration.lcpBeforeHydration !== undefined ? `
| LCP Before Hydration | ${hydration.lcpBeforeHydration.toFixed(2)}ms |` : ''
}${
  hydration.lcpAfterHydration !== undefined ? `
| LCP After Hydration | ${hydration.lcpAfterHydration.toFixed(2)}ms |` : ''
}${
  hydration.lcpElement ? `
| LCP Element | \`${hydration.lcpElement}\` |` : ''
}`;
  }

  private generateResources(resources: ResourceTimingEntry[], max: number): string {
    const sorted = [...resources]
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, max);

    let content = `## Resource Timing (Top ${max})\n\n`;
    content += '| Resource | Type | Size | Duration | Blocking |\n';
    content += '|----------|------|------|----------|----------|\n';

    for (const r of sorted) {
      const name = this.truncateUrl(r.name, 50);
      const size = this.formatBytes(r.transferSize);
      const duration = `${r.duration.toFixed(2)}ms`;
      const blocking = r.renderBlockingStatus === 'blocking' ? '⚠️ Yes' : 'No';
      content += `| ${name} | ${r.initiatorType} | ${size} | ${duration} | ${blocking} |\n`;
    }

    // Add blocking resources summary
    const blocking = resources.filter(r => r.renderBlockingStatus === 'blocking');
    if (blocking.length > 0) {
      content += `\n### Render-Blocking Resources (${blocking.length})\n\n`;
      blocking.forEach(r => {
        content += `- \`${this.truncateUrl(r.name, 60)}\` (${this.formatBytes(r.transferSize)})\n`;
      });
    }

    return content;
  }

  private generateLongFrames(frames: LongAnimationFrameEntry[], max: number): string {
    const sorted = [...frames]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, max);

    let content = `## Long Animation Frames (Top ${max})\n\n`;
    content += '| Duration | Blocking | Render Start | Scripts |\n';
    content += '|----------|----------|--------------|--------|\n';

    for (const f of sorted) {
      const scripts = f.scripts.length > 0 
        ? f.scripts.map(s => this.truncateUrl(s.sourceURL, 30)).join(', ')
        : 'unknown';
      content += `| ${f.duration.toFixed(2)}ms | ${f.blockingDuration.toFixed(2)}ms | ${f.renderStart.toFixed(2)}ms | ${scripts} |\n`;
    }

    // Add worst scripts summary
    const scriptMap = new Map<string, { totalDuration: number; count: number }>();
    frames.forEach(frame => {
      frame.scripts.forEach(script => {
        const url = script.sourceURL || 'unknown';
        const existing = scriptMap.get(url) || { totalDuration: 0, count: 0 };
        scriptMap.set(url, {
          totalDuration: existing.totalDuration + script.duration,
          count: existing.count + 1,
        });
      });
    });

    if (scriptMap.size > 0) {
      content += '\n### Worst Offending Scripts\n\n';
      const worstScripts = Array.from(scriptMap.entries())
        .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
        .slice(0, 5);
      
      for (const [url, stats] of worstScripts) {
        content += `- \`${this.truncateUrl(url, 60)}\` - ${stats.totalDuration.toFixed(2)}ms total (${stats.count} occurrences)\n`;
      }
    }

    return content;
  }

  private generateApiCalls(calls: APICallMetric[], max: number): string {
    const sorted = [...calls]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, max);

    let content = `## API Calls (Top ${max})\n\n`;
    content += '| Endpoint | Method | Status | Duration | TTFB | Blocked LCP | Blocked INP |\n';
    content += '|----------|--------|--------|----------|------|-------------|-------------|\n';

    for (const c of sorted) {
      const url = this.truncateUrl(c.url, 40);
      const blockedLCP = c.blockedLCP ? '⚠️ Yes' : 'No';
      const blockedINP = c.blockedINP ? '⚠️ Yes' : 'No';
      content += `| ${url} | ${c.method} | ${c.status} | ${c.duration.toFixed(2)}ms | ${c.ttfb.toFixed(2)}ms | ${blockedLCP} | ${blockedINP} |\n`;
    }

    // Summary of blocking calls
    const lcpBlocking = calls.filter(c => c.blockedLCP);
    const inpBlocking = calls.filter(c => c.blockedINP);

    if (lcpBlocking.length > 0 || inpBlocking.length > 0) {
      content += '\n### Performance-Impacting API Calls\n\n';
      
      if (lcpBlocking.length > 0) {
        content += `**LCP Blocking (${lcpBlocking.length}):**\n`;
        lcpBlocking.forEach(c => {
          content += `- \`${c.method} ${this.truncateUrl(c.url, 50)}\` (${c.duration.toFixed(2)}ms)\n`;
        });
      }
      
      if (inpBlocking.length > 0) {
        content += `\n**INP Blocking (${inpBlocking.length}):**\n`;
        inpBlocking.forEach(c => {
          content += `- \`${c.method} ${this.truncateUrl(c.url, 50)}\` (${c.duration.toFixed(2)}ms)\n`;
        });
      }
    }

    return content;
  }

  private generateQueryCache(stats: NonNullable<PerformanceSession['queryCache']>): string {
    let content = '## TanStack Query Cache\n\n';
    
    content += '| Metric | Value |\n';
    content += '|--------|-------|\n';
    content += `| Total Queries | ${stats.totalQueries} |\n`;
    content += `| Active Queries | ${stats.activeQueries} |\n`;
    content += `| Stale Queries | ${stats.staleQueries} |\n`;
    content += `| Errored Queries | ${stats.erroredQueries} |\n`;
    content += `| Cache Hit Rate | ${(stats.cacheHitRate * 100).toFixed(1)}% |\n`;
    content += `| Avg Fetch Duration | ${stats.averageFetchDuration.toFixed(2)}ms |\n`;

    // Slowest queries
    if (stats.slowestQueries.length > 0) {
      content += '\n### Slowest Queries\n\n';
      content += '| Query Key | Duration | Status | Blocked LCP | Blocked INP |\n';
      content += '|-----------|----------|--------|-------------|-------------|\n';
      
      for (const q of stats.slowestQueries.slice(0, 5)) {
        const key = this.truncateUrl(q.queryKey, 40);
        const duration = q.fetchDuration ? `${q.fetchDuration.toFixed(2)}ms` : 'N/A';
        const blockedLCP = q.blockedLCP ? '⚠️ Yes' : 'No';
        const blockedINP = q.blockedINP ? '⚠️ Yes' : 'No';
        content += `| ${key} | ${duration} | ${q.status} | ${blockedLCP} | ${blockedINP} |\n`;
      }
    }

    // Most frequent queries
    if (stats.mostFrequentQueries.length > 0) {
      content += '\n### Most Frequent Queries\n\n';
      for (const q of stats.mostFrequentQueries.slice(0, 5)) {
        content += `- \`${this.truncateUrl(q.queryKey, 50)}\` - ${q.count} executions\n`;
      }
    }

    return content;
  }

  private generateFooter(): string {
    return `---

*Generated by Performance Monitor*  
*Report generated at: ${new Date().toISOString()}*`;
  }

  // Utility methods

  private formatMetricValue(name: string, value: number): string {
    switch (name) {
      case 'CLS':
        return value.toFixed(3);
      case 'LCP':
      case 'FCP':
      case 'TTFB':
      case 'INP':
        return `${value.toFixed(2)}ms`;
      default:
        return value.toFixed(2);
    }
  }

  private getRatingEmoji(rating: string): string {
    switch (rating) {
      case 'good':
        return '🟢';
      case 'needs-improvement':
        return '🟡';
      case 'poor':
        return '🔴';
      default:
        return '⚪';
    }
  }

  private formatAttribution(name: string, attribution: any): string {
    const entries = Object.entries(attribution)
      .filter(([, value]) => value !== undefined && value !== null && value !== 0 && value !== '')
      .map(([key, value]) => {
        if (typeof value === 'number') {
          return `- **${this.camelToTitle(key)}:** ${value.toFixed(2)}ms`;
        }
        return `- **${this.camelToTitle(key)}:** ${value}`;
      });

    return entries.join('\n');
  }

  private camelToTitle(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  private truncateUrl(url: string, maxLength: number): string {
    if (url.length <= maxLength) return url;
    
    // Try to show meaningful part of URL
    try {
      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search;
      if (path.length <= maxLength) return path;
      return path.substring(0, maxLength - 3) + '...';
    } catch {
      return url.substring(0, maxLength - 3) + '...';
    }
  }
}

// Singleton instance
let instance: MarkdownReporter | null = null;

export function getMarkdownReporter(): MarkdownReporter {
  if (!instance) {
    instance = new MarkdownReporter();
  }
  return instance;
}

