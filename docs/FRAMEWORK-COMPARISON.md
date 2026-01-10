# Framework Support & Feature Matrix

## Supported Frameworks

| Framework | Version | Status | Notes |
|-----------|---------|--------|-------|
| **React** | 16.8+ | ✅ Full Support | Hooks, SSR, Next.js |
| **Vue** | 3.0+ | ✅ Full Support | Composition API, Nuxt 3 |
| **TanStack Query (React)** | 4.x, 5.x | ✅ Full Support | React Query monitoring |
| **TanStack Query (Vue)** | 4.x, 5.x | ✅ Full Support | Vue Query monitoring |
| **Next.js** | 12+ | ✅ Full Support | Pages Router & App Router |
| **Nuxt** | 3.x | ✅ Full Support | SSR & SSG |
| **Other** | Any | ✅ Framework-Agnostic | Use generic initialization |

## Feature Comparison

### Core Features

| Feature | React | Vue | Framework-Agnostic |
|---------|-------|-----|--------------------|
| Core Web Vitals | ✅ | ✅ | ✅ |
| Resource Timing | ✅ | ✅ | ✅ |
| Long Animation Frames | ✅ | ✅ | ✅ |
| API Correlation | ✅ | ✅ | ✅ |
| TanStack Query Monitoring | ✅ | ✅ | N/A |
| Hydration Tracking | ✅ | ✅ | ✅ |
| Markdown Reports | ✅ | ✅ | ✅ |

### Framework-Specific Features

#### React

| Feature | Support | Implementation |
|---------|---------|----------------|
| Hooks Support | ✅ | useEffect-based tracking |
| Context API | ✅ | PerformanceProvider |
| SSR/SSG | ✅ | Next.js integration |
| Component Tracking | ✅ | useComponentPerformance |
| Auto-Reporting | ✅ | useAutoPerformanceReporting |
| React Query | ✅ | Full @tanstack/react-query support |

#### Vue

| Feature | Support | Implementation |
|---------|---------|----------------|
| Composition API | ✅ | Composables |
| Provide/Inject | ✅ | Plugin system |
| SSR/SSG | ✅ | Nuxt 3 integration |
| Component Tracking | ✅ | useComponentPerformance |
| Auto-Reporting | ✅ | useAutoReporting |
| Vue Query | ✅ | Full @tanstack/vue-query support |

### TanStack Query Features

| Metric | React Query | Vue Query | Description |
|--------|-------------|-----------|-------------|
| Query Execution Count | ✅ | ✅ | Total queries executed |
| Cache Hit Rate | ✅ | ✅ | % of queries served from cache |
| Query Duration | ✅ | ✅ | Fetch time per query |
| Slow Query Detection | ✅ | ✅ | Queries >1000ms |
| LCP Blocking | ✅ | ✅ | Queries blocking LCP |
| INP Blocking | ✅ | ✅ | Queries blocking interactions |
| Error Tracking | ✅ | ✅ | Failed queries |
| Stale Query Detection | ✅ | ✅ | Queries needing refresh |
| Most Frequent Queries | ✅ | ✅ | Top executed queries |

## Integration Methods

### React Integration Points

```
1. index.tsx/main.tsx
   ├── Initialize monitoring
   ├── Initialize QueryClient
   └── Mark hydration boundaries

2. App.tsx
   ├── PerformanceProvider (optional)
   ├── useAutoReporting hook
   └── Report button component

3. Components
   ├── useComponentPerformance
   ├── useQueryWithPerformance
   └── usePerformance context
```

### Vue Integration Points

```
1. main.ts
   ├── Initialize monitoring
   ├── Initialize QueryClient
   └── Mark hydration boundaries

2. plugins/
   ├── performance-monitor.client.ts
   └── Auto-reporting plugin

3. composables/
   ├── usePerformanceMonitor
   ├── useComponentPerformance
   ├── useQueryPerformance
   └── useAutoReporting

4. Components
   └── PerformanceReporter.vue
```

## File Structure

```
monitoring/
├── core/
│   ├── WebVitalsMonitor.ts          ✅ Framework-agnostic
│   ├── ResourceTimingMonitor.ts      ✅ Framework-agnostic
│   ├── LoAFMonitor.ts                ✅ Framework-agnostic
│   ├── APICorrelationMonitor.ts      ✅ Framework-agnostic
│   └── TanStackQueryMonitor.ts       ✅ Works with both React & Vue Query
│
├── reporters/
│   └── MarkdownReporter.ts           ✅ Framework-agnostic
│
├── types/
│   └── monitoring.types.ts           ✅ Framework-agnostic
│
├── examples/
│   ├── ReactIntegration.tsx          🔵 React-specific
│   ├── VueIntegration.ts             🟢 Vue-specific
│   └── NextJsIntegration.tsx         🔵 Next.js-specific
│
└── index.ts                          ✅ Framework-agnostic (with helpers)
```

## Browser API Support

### Core Web Vitals
- **Chrome/Edge**: Full support (77+)
- **Firefox**: Full support (89+)
- **Safari**: Full support (15.4+)

### Long Animation Frames
- **Chrome/Edge**: Native support (116+)
- **Others**: Fallback to longtask API

### Resource Timing
- **All modern browsers**: Full support

### TanStack Query
- Works in all browsers that support the framework

## Performance Overhead

| Component | Overhead | Notes |
|-----------|----------|-------|
| Core monitoring | ~1KB gzipped | Web Vitals + observers |
| Resource tracking | ~0.5KB gzipped | Passive observation |
| TanStack Query monitoring | ~1KB gzipped | Event subscription |
| Markdown reporter | ~0.5KB gzipped | On-demand generation |
| **Total** | **~3KB gzipped** | Minimal impact |

## When to Use Each Framework

### Choose React Integration When:
- ✅ Using React 16.8+
- ✅ Next.js application (Pages or App Router)
- ✅ Using React Query (@tanstack/react-query)
- ✅ Need hooks-based API
- ✅ Client-side or SSR React apps

### Choose Vue Integration When:
- ✅ Using Vue 3 with Composition API
- ✅ Nuxt 3 application
- ✅ Using Vue Query (@tanstack/vue-query)
- ✅ Need composables-based API
- ✅ Client-side or SSR Vue apps

### Choose Framework-Agnostic When:
- ✅ Using Svelte, Solid, or other frameworks
- ✅ Vanilla JavaScript application
- ✅ Progressive web app
- ✅ Need maximum flexibility

## Migration Guide

### From React-Only to Multi-Framework

**Before:**
```typescript
import { initializePerformanceMonitoring } from './monitoring';
const monitor = initializePerformanceMonitoring();
```

**After:**
```typescript
// React apps
import { initializeReactMonitoring } from './monitoring';
const monitor = initializeReactMonitoring();

// Vue apps
import { initializeVueMonitoring } from './monitoring';
const monitor = initializeVueMonitoring();

// Other frameworks
import { initializePerformanceMonitoring } from './monitoring';
const monitor = initializePerformanceMonitoring('other');
```

### Adding TanStack Query Support

**After initializing the monitor:**
```typescript
// React
import { QueryClient } from '@tanstack/react-query';
const queryClient = new QueryClient();
monitor.initializeQueryClient(queryClient);

// Vue
import { QueryClient } from '@tanstack/vue-query';
const queryClient = new QueryClient();
monitor.initializeQueryClient(queryClient);
```

## Best Practices by Framework

### React
1. Initialize in `index.tsx` before `ReactDOM.render()`
2. Use Context API for deep component access
3. Leverage hooks for component-level tracking
4. Initialize QueryClient before monitor

### Vue
1. Initialize in `main.ts` before `app.mount()`
2. Use plugins for app-wide setup
3. Create composables for reusable logic
4. Initialize QueryClient in plugin

### Next.js
1. Use client-side plugin (`*.client.ts`)
2. Initialize in `_app.tsx` or `layout.tsx`
3. Create API route for analytics
4. Use server timing for backend tracking

### Nuxt 3
1. Use `.client.ts` plugin suffix
2. Initialize in plugin with proper hooks
3. Create server API route
4. Use `useNuxtApp()` for access

## Common Patterns

### Pattern 1: Global Monitoring + Per-Route Reporting

**React (Next.js):**
```tsx
// Global: app/layout.tsx
<Providers /> // Initializes monitoring

// Per-route: app/dashboard/page.tsx
useAutoReporting(); // Sends data on exit
```

**Vue (Nuxt):**
```typescript
// Global: plugins/performance.client.ts
initializeVueMonitoring()

// Per-route: pages/dashboard.vue
useAutoReporting()
```

### Pattern 2: Development vs Production

```typescript
const monitor = initializeReactMonitoring();

if (process.env.NODE_ENV === 'production') {
  // Sample 10% of users
  if (Math.random() < 0.1) {
    monitor.sendToAnalytics('/api/performance');
  }
} else {
  // Always report in development
  monitor.downloadReport();
}
```

### Pattern 3: A/B Testing Integration

```typescript
const monitor = initializeReactMonitoring();
const session = monitor.getPerformanceSession();

// Add variant info before sending
const dataWithVariant = {
  ...session,
  abTestVariant: getUserVariant(),
};

sendToAnalytics(dataWithVariant);
```
