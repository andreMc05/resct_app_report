# Web Performance Monitoring for React, Vue & TanStack Query

A comprehensive, production-ready performance monitoring solution that works with **React**, **Vue 3**, and **TanStack Query** (React Query / Vue Query). Tracks Core Web Vitals, resource timing, long animation frames, API correlations, and TanStack Query performance with detailed markdown reporting.

## Features

✅ **Framework Support**
- React 16.8+ (Hooks, SSR, Next.js)
- Vue 3 (Composition API, Nuxt 3)
- Framework-agnostic core (works with any JS framework)

✅ **TanStack Query Integration**
- @tanstack/react-query monitoring
- @tanstack/vue-query monitoring
- Query cache performance tracking
- Cache hit rate analysis
- Slow query detection

✅ **Core Web Vitals Monitoring**
- LCP (Largest Contentful Paint) with element attribution
- CLS (Cumulative Layout Shift) with shift attribution
- INP (Interaction to Next Paint) with event attribution
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

✅ **Resource Performance**
- Detailed resource timing for all assets
- Render-blocking resource identification
- Compression ratio analysis
- Size and duration tracking

✅ **Long Animation Frames (LoAF)**
- Main thread blocking detection
- Script attribution for long tasks
- Total Blocking Time (TBT) calculation

✅ **API Correlation**
- Automatic API call tracking (fetch & XMLHttpRequest)
- LCP and INP blocking identification
- TanStack Query correlation
- Latency and TTFB measurement

✅ **Reporting**
- Comprehensive markdown reports
- Downloadable reports
- Analytics endpoint integration
- TanStack Query statistics

## Installation

### 1. Install Required Dependencies

```bash
# Core dependency
npm install web-vitals

# For React apps with TanStack Query
npm install @tanstack/react-query

# For Vue apps with TanStack Query
npm install @tanstack/vue-query
```

### 2. Copy Monitoring Files

Copy the entire `monitoring/` directory into your project's `src/` folder.

## Quick Start

### React + TanStack Query (React Query)

```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from './monitoring';
import App from './App';

// Create QueryClient
const queryClient = new QueryClient();

// Initialize monitoring
const perfMonitor = initializeReactMonitoring();

// Initialize TanStack Query monitoring
perfMonitor.initializeQueryClient(queryClient);

// Mark hydration
perfMonitor.markHydrationStart();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// Mark hydration complete
setTimeout(() => perfMonitor.markHydrationEnd(), 0);
```

### Vue 3 + TanStack Query (Vue Query)

```typescript
// main.ts
import { createApp } from 'vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { initializeVueMonitoring } from './monitoring';
import App from './App.vue';

const queryClient = new QueryClient();

// Initialize monitoring
const perfMonitor = initializeVueMonitoring();
perfMonitor.initializeQueryClient(queryClient);

perfMonitor.markHydrationStart();

const app = createApp(App);
app.use(VueQueryPlugin, { queryClient });
app.mount('#app');

setTimeout(() => perfMonitor.markHydrationEnd(), 0);
```

### Nuxt 3

```typescript
// plugins/performance-monitor.client.ts
import { defineNuxtPlugin } from '#app';
import { initializeVueMonitoring } from '~/monitoring';

export default defineNuxtPlugin((nuxtApp) => {
  const perfMonitor = initializeVueMonitoring();
  
  if (nuxtApp.$queryClient) {
    perfMonitor.initializeQueryClient(nuxtApp.$queryClient);
  }
  
  perfMonitor.markHydrationStart();
  
  nuxtApp.hook('app:mounted', () => {
    perfMonitor.markHydrationEnd();
  });
});
```

### Next.js App Router

```tsx
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from '@/monitoring';

const queryClient = new QueryClient();

export function Providers({ children }) {
  useEffect(() => {
    const monitor = initializeReactMonitoring();
    monitor.initializeQueryClient(queryClient);
    monitor.markHydrationStart();
    setTimeout(() => monitor.markHydrationEnd(), 0);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Usage

### Generate and Download a Report

**React:**
```tsx
import { getPerformanceMonitor } from '@/monitoring';

function ReportButton() {
  const handleDownload = () => {
    const monitor = getPerformanceMonitor('react');
    monitor.downloadReport();
  };

  return <button onClick={handleDownload}>Download Report</button>;
}
```

**Vue:**
```vue
<script setup>
import { getPerformanceMonitor } from '~/monitoring';

const handleDownload = () => {
  const monitor = getPerformanceMonitor('vue');
  monitor.downloadReport();
};
</script>

<template>
  <button @click="handleDownload">Download Report</button>
</template>
```

### Send Data to Analytics

```typescript
const monitor = getPerformanceMonitor('react'); // or 'vue'
await monitor.sendToAnalytics('/api/performance');
```

### Access Performance Session Data

```typescript
const monitor = getPerformanceMonitor('react');
const session = monitor.getPerformanceSession();

console.log('Web Vitals:', session.webVitals);
console.log('TanStack Query Stats:', session.queryCache);
console.log('API Calls:', session.apiCalls);
```

## React Hooks

### useComponentPerformance

Track component render time:

```tsx
import { useComponentPerformance } from '@/monitoring/examples/ReactIntegration';

function ProductList() {
  useComponentPerformance('ProductList');
  
  return <div>Products</div>;
}
```

### useAutoPerformanceReporting

Automatically report performance data:

```tsx
import { useAutoPerformanceReporting } from '@/monitoring/examples/ReactIntegration';

function App() {
  useAutoPerformanceReporting(); // Sends data on page exit or after 10s
  
  return <div>App</div>;
}
```

### useQueryWithPerformance

Enhanced TanStack Query hook with performance tracking:

```tsx
import { useQueryWithPerformance } from '@/monitoring/examples/ReactIntegration';

function Products() {
  const { data, isLoading } = useQueryWithPerformance(
    ['products'],
    () => fetchProducts()
  );
  
  return <div>{/* render products */}</div>;
}
```

## Vue Composables

### usePerformanceMonitor

```typescript
import { usePerformanceMonitor } from '~/composables/usePerformanceMonitor';

const { downloadReport, sendToAnalytics } = usePerformanceMonitor();
```

### useComponentPerformance

```typescript
import { useComponentPerformance } from '~/composables/useComponentPerformance';

// In your component
useComponentPerformance('ProductList');
```

### useQueryWithPerformance

Enhanced Vue Query composable:

```typescript
import { useQueryWithPerformance } from '~/composables/useQueryPerformance';

const { data, isLoading } = useQueryWithPerformance(
  ['products'],
  () => fetchProducts()
);
```

## Report Output

The generated markdown report includes:

### Framework-Specific Sections
- **Framework Identification** (React, Vue, or Other)
- **Hydration Performance** with framework-specific timing
- **TanStack Query Performance**
  - Total queries and cache statistics
  - Cache hit rate analysis
  - Slowest queries with LCP/INP correlation
  - Most frequently executed queries

### Core Performance Metrics
- **Executive Summary** with all key statistics
- **Core Web Vitals** with detailed attribution
- **Navigation Timing** breakdown
- **Resource Performance** analysis
- **API Performance** with blocking detection
- **Long Animation Frames** with script attribution
- **Actionable Recommendations** based on measured data

## API Reference

### PerformanceMonitor

```typescript
class PerformanceMonitor {
  // Initialize monitoring
  initialize(): void;
  
  // Initialize TanStack Query tracking
  initializeQueryClient(queryClient: QueryClient): void;
  
  // Mark hydration boundaries
  markHydrationStart(): void;
  markHydrationEnd(componentCount?: number): void;
  
  // Generate reports
  generateReport(options?: ReportOptions): string;
  downloadReport(options?: ReportOptions): void;
  
  // Get raw data
  getPerformanceSession(): PerformanceSession;
  
  // Send to analytics
  sendToAnalytics(endpoint: string): Promise<void>;
  
  // Clear all data
  clear(): void;
}
```

### Initialization Functions

```typescript
// React-specific initialization
initializeReactMonitoring(): PerformanceMonitor;

// Vue-specific initialization
initializeVueMonitoring(): PerformanceMonitor;

// Generic initialization
initializePerformanceMonitoring(framework?: 'react' | 'vue' | 'other'): PerformanceMonitor;

// Get monitor instance
getPerformanceMonitor(framework?: 'react' | 'vue' | 'other'): PerformanceMonitor;
```

## TanStack Query Monitoring

The monitor automatically tracks:

- **Query Executions**: Total count and frequency
- **Cache Performance**: Hit rate and efficiency
- **Query Duration**: Fetch times and slow queries
- **Error Tracking**: Failed queries
- **LCP/INP Correlation**: Queries that block rendering or interaction
- **Stale Data**: Queries that need refreshing

### Query Performance Metrics

```typescript
interface QueryCacheStats {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  erroredQueries: number;
  averageFetchDuration: number;
  cacheHitRate: number;
  slowestQueries: QueryCacheMetric[];
  mostFrequentQueries: Array<{ queryKey: string; count: number }>;
}
```

## Browser Compatibility

- **Core Web Vitals**: All modern browsers (Chrome 77+, Firefox 89+, Safari 15.4+)
- **Resource Timing**: All modern browsers
- **Long Animation Frames**: Chrome 116+ (fallback to longtask API)
- **TanStack Query**: Supports TanStack Query v4 and v5

## Performance Impact

This monitoring library has minimal performance overhead:

- Passive observation using PerformanceObserver
- No synchronous blocking operations
- Efficient data collection and aggregation
- ~3KB gzipped overhead (including TanStack Query monitoring)

## Best Practices

1. **Initialize Early**: Call initialization functions before rendering
2. **Mark Hydration**: Accurately mark hydration start/end for SSR/SSG
3. **Sample in Production**: Monitor 10-20% of users to reduce load
4. **Configure TanStack Query**: Set appropriate staleTime and cacheTime
5. **Monitor Query Performance**: Use slow query detection to optimize

## Example: Complete React + Next.js + TanStack Query Setup

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from '@/monitoring';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const monitor = initializeReactMonitoring();
    monitor.initializeQueryClient(queryClient);
    monitor.markHydrationStart();
    
    setTimeout(() => {
      monitor.markHydrationEnd();
      
      // Auto-report after 10 seconds
      setTimeout(() => {
        monitor.sendToAnalytics('/api/performance');
      }, 10000);
    }, 0);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Example: Complete Vue + Nuxt 3 + TanStack Query Setup

```typescript
// plugins/performance.client.ts
import { defineNuxtPlugin } from '#app';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { initializeVueMonitoring } from '~/monitoring';

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
      },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  const monitor = initializeVueMonitoring();
  monitor.initializeQueryClient(queryClient);
  monitor.markHydrationStart();

  nuxtApp.hook('app:mounted', () => {
    monitor.markHydrationEnd();
    
    setTimeout(() => {
      monitor.sendToAnalytics('/api/performance');
    }, 10000);
  });
});
```

## License

MIT - Use freely in your projects

## Credits

Built with:
- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Official Google Web Vitals library
- W3C Performance APIs
- Chrome Long Animation Frames API
- TanStack Query (React Query / Vue Query)
