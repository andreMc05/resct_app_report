# Quick Start Guide - React, Vue & TanStack Query

## Installation

### 1. Install Dependencies

```bash
# Core dependency (required)
npm install web-vitals

# For React + React Query
npm install @tanstack/react-query

# For Vue + Vue Query
npm install @tanstack/vue-query
```

### 2. Copy Files

Copy the `monitoring/` folder into your `src/` directory:

```
src/
├── monitoring/
│   ├── core/
│   ├── reporters/
│   ├── types/
│   ├── examples/
│   └── index.ts
```

---

## React Integration

### Standard React App (Vite, CRA)

```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from './monitoring';
import App from './App';

const queryClient = new QueryClient();
const perfMonitor = initializeReactMonitoring();

// Initialize TanStack Query monitoring
perfMonitor.initializeQueryClient(queryClient);

perfMonitor.markHydrationStart();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

setTimeout(() => perfMonitor.markHydrationEnd(), 0);
```

### Next.js App Router

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from '@/monitoring';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
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

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from '@/monitoring';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const monitor = initializeReactMonitoring();
    monitor.initializeQueryClient(queryClient);
    monitor.markHydrationStart();
    setTimeout(() => monitor.markHydrationEnd(), 0);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

---

## Vue Integration

### Vue 3 + Vite

```typescript
// main.ts
import { createApp } from 'vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { initializeVueMonitoring } from './monitoring';
import App from './App.vue';

const queryClient = new QueryClient();
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
  
  // If using TanStack Vue Query
  if (nuxtApp.$queryClient) {
    perfMonitor.initializeQueryClient(nuxtApp.$queryClient);
  }
  
  perfMonitor.markHydrationStart();
  
  nuxtApp.hook('app:mounted', () => {
    perfMonitor.markHydrationEnd();
  });
  
  // Provide to all components
  return {
    provide: {
      perfMonitor,
    },
  };
});
```

---

## Usage Examples

### Download Performance Report

**React:**
```tsx
import { getPerformanceMonitor } from '@/monitoring';

function ReportButton() {
  return (
    <button onClick={() => getPerformanceMonitor('react').downloadReport()}>
      Download Report
    </button>
  );
}
```

**Vue:**
```vue
<script setup>
import { getPerformanceMonitor } from '~/monitoring';

const downloadReport = () => {
  getPerformanceMonitor('vue').downloadReport();
};
</script>

<template>
  <button @click="downloadReport">Download Report</button>
</template>
```

### Send to Analytics

```typescript
// React or Vue
import { getPerformanceMonitor } from './monitoring';

const monitor = getPerformanceMonitor('react'); // or 'vue'
await monitor.sendToAnalytics('/api/performance');
```

### View Session Data

```typescript
import { getPerformanceMonitor } from './monitoring';

const monitor = getPerformanceMonitor('react');
const session = monitor.getPerformanceSession();

console.log('Core Web Vitals:', session.webVitals);
console.log('TanStack Query Stats:', session.queryCache);
console.log('Hydration:', session.hydration);
```

---

## React Hooks

### Auto-Reporting Hook

```tsx
import { useEffect } from 'react';
import { getPerformanceMonitor } from '@/monitoring';

export function useAutoReporting() {
  useEffect(() => {
    const monitor = getPerformanceMonitor('react');
    
    const handler = () => monitor.sendToAnalytics('/api/performance');
    window.addEventListener('beforeunload', handler);
    
    // Or delayed reporting
    const timer = setTimeout(handler, 10000);
    
    return () => {
      window.removeEventListener('beforeunload', handler);
      clearTimeout(timer);
    };
  }, []);
}

// Usage in App.tsx
function App() {
  useAutoReporting();
  return <div>App</div>;
}
```

### Component Performance Hook

```tsx
import { useEffect } from 'react';

export function useComponentPerformance(name: string) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      console.log(`${name}: ${(performance.now() - start).toFixed(2)}ms`);
    };
  }, [name]);
}

// Usage
function ProductList() {
  useComponentPerformance('ProductList');
  return <div>Products</div>;
}
```

---

## Vue Composables

### Auto-Reporting Composable

```typescript
// composables/useAutoReporting.ts
import { onMounted, onUnmounted } from 'vue';
import { getPerformanceMonitor } from '~/monitoring';

export function useAutoReporting() {
  const monitor = getPerformanceMonitor('vue');
  
  const handler = () => {
    monitor.sendToAnalytics('/api/performance');
  };
  
  onMounted(() => {
    window.addEventListener('beforeunload', handler);
    setTimeout(handler, 10000);
  });
  
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handler);
  });
}

// Usage in component
<script setup>
import { useAutoReporting } from '~/composables/useAutoReporting';
useAutoReporting();
</script>
```

### Component Performance Composable

```typescript
// composables/useComponentPerformance.ts
import { onMounted, onUnmounted } from 'vue';

export function useComponentPerformance(name: string) {
  let start: number;
  
  onMounted(() => {
    start = performance.now();
  });
  
  onUnmounted(() => {
    console.log(`${name}: ${(performance.now() - start).toFixed(2)}ms`);
  });
}

// Usage
<script setup>
import { useComponentPerformance } from '~/composables/useComponentPerformance';
useComponentPerformance('ProductList');
</script>
```

---

## API Endpoint (for Analytics)

### Next.js API Route

```typescript
// pages/api/performance.ts (Pages Router)
// or app/api/performance/route.ts (App Router)

export async function POST(request: Request) {
  const data = await request.json();
  
  console.log('Performance data:', {
    framework: data.framework,
    url: data.url,
    vitals: data.webVitals,
    queryCache: data.queryCache,
  });
  
  // Store in database, send to analytics service, etc.
  
  return Response.json({ success: true });
}
```

### Nuxt 3 API Route

```typescript
// server/api/performance.post.ts
export default defineEventHandler(async (event) => {
  const data = await readBody(event);
  
  console.log('Performance data:', {
    framework: data.framework,
    url: data.url,
    vitals: data.webVitals,
    queryCache: data.queryCache,
  });
  
  // Store or forward to analytics
  
  return { success: true };
});
```

---

## What Gets Monitored

✅ **Core Web Vitals**
- LCP, CLS, INP, FCP, TTFB with attribution

✅ **TanStack Query**
- Query executions, cache hits, slow queries
- LCP/INP blocking queries

✅ **Resources**
- All CSS, JS, images, fonts
- Render-blocking detection

✅ **APIs**
- fetch/XHR tracking
- Latency measurement

✅ **Long Tasks**
- Main thread blocking
- Script attribution

✅ **Framework Hydration**
- React/Vue hydration timing
- Component counts

---

## Report Features

The downloadable markdown report includes:

- Executive summary with all metrics
- Core Web Vitals with detailed attribution
- Framework hydration performance (React/Vue)
- **TanStack Query statistics**:
  - Cache hit rate
  - Slowest queries
  - Most frequent queries
  - Queries blocking LCP/INP
- Resource analysis
- API performance
- Long animation frames
- Actionable recommendations

---

## Troubleshooting

**Q: No metrics showing?**  
A: Call `initialize()` before app renders

**Q: TanStack Query stats missing?**  
A: Call `initializeQueryClient(queryClient)` after creating QueryClient

**Q: "web-vitals not found"?**  
A: Run `npm install web-vitals`

**Q: Hydration metrics missing?**  
A: Call both `markHydrationStart()` and `markHydrationEnd()`

---

## Next Steps

1. **Add Report Button**: Use examples above
2. **Set Up Analytics**: Create API endpoint
3. **Enable Auto-Reporting**: Use hooks/composables
4. **Configure TanStack Query**: Set staleTime, cacheTime
5. **Monitor Production**: Sample 10-20% of users

See full `README-UPDATED.md` for complete API reference and advanced usage.
