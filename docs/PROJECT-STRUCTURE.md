# Project Structure Guide

## React + Vite + TanStack Query

```
my-react-app/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── monitoring/                      # 📊 Performance monitoring (copy from package)
│   │   ├── core/
│   │   │   ├── WebVitalsMonitor.ts
│   │   │   ├── ResourceTimingMonitor.ts
│   │   │   ├── LoAFMonitor.ts
│   │   │   ├── APICorrelationMonitor.ts
│   │   │   └── TanStackQueryMonitor.ts
│   │   ├── reporters/
│   │   │   └── MarkdownReporter.ts
│   │   ├── types/
│   │   │   └── monitoring.types.ts
│   │   ├── examples/
│   │   │   ├── ReactIntegration.tsx
│   │   │   └── NextJsIntegration.tsx
│   │   └── index.ts
│   │
│   ├── components/                      # React components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── features/
│   │   │   ├── ProductList.tsx
│   │   │   └── UserProfile.tsx
│   │   └── PerformanceReporter.tsx      # 📊 Performance report button
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── useProducts.ts               # TanStack Query hooks
│   │   ├── useUser.ts
│   │   ├── useComponentPerformance.ts   # 📊 Performance tracking
│   │   └── useAutoReporting.ts          # 📊 Auto-reporting
│   │
│   ├── lib/                             # Utilities and configs
│   │   ├── api.ts                       # API client (axios/fetch)
│   │   ├── queryClient.ts               # TanStack Query client config
│   │   └── utils.ts
│   │
│   ├── pages/                           # Page components
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   └── Dashboard.tsx
│   │
│   ├── types/                           # TypeScript types
│   │   ├── product.ts
│   │   └── user.ts
│   │
│   ├── App.tsx                          # Main app component
│   ├── main.tsx                         # 📊 Entry point - initialize monitoring here
│   └── vite-env.d.ts
│
├── .env
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files for React + Vite

**`src/main.tsx`** - Initialize monitoring here:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from './monitoring';
import App from './App';
import './index.css';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize performance monitoring
const perfMonitor = initializeReactMonitoring();
perfMonitor.initializeQueryClient(queryClient);
perfMonitor.markHydrationStart();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

setTimeout(() => perfMonitor.markHydrationEnd(), 0);
```

**`src/hooks/useProducts.ts`** - TanStack Query example:
```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });
}
```

**`src/components/PerformanceReporter.tsx`** - Report button:
```tsx
import { getPerformanceMonitor } from '@/monitoring';

export function PerformanceReporter() {
  const handleDownload = () => {
    const monitor = getPerformanceMonitor('react');
    monitor.downloadReport();
  };

  return (
    <button onClick={handleDownload}>
      📊 Download Performance Report
    </button>
  );
}
```

---

## Next.js 14 (App Router) + TanStack Query

```
my-nextjs-app/
├── public/
│   └── images/
│
├── src/
│   ├── monitoring/                      # 📊 Performance monitoring
│   │   └── [same structure as above]
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── performance/
│   │   │       └── route.ts             # 📊 Analytics endpoint
│   │   ├── products/
│   │   │   └── page.tsx
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Home page
│   │   └── providers.tsx                # 📊 Initialize monitoring here
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── features/
│   │   └── PerformanceReporter.tsx
│   │
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useComponentPerformance.ts   # 📊
│   │   └── useAutoReporting.ts          # 📊
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── queryClient.ts
│   │
│   └── types/
│
├── .env.local
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### Key Files for Next.js (App Router)

**`src/app/providers.tsx`** - Client-side providers:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring } from '@/monitoring';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const monitor = initializeReactMonitoring();
    monitor.initializeQueryClient(queryClient);
    monitor.markHydrationStart();
    
    setTimeout(() => {
      monitor.markHydrationEnd();
    }, 0);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**`src/app/layout.tsx`** - Root layout:
```tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**`src/app/api/performance/route.ts`** - Analytics endpoint:
```tsx
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  
  // Log or store performance data
  console.log('Performance data:', {
    url: data.url,
    framework: data.framework,
    vitals: data.webVitals,
    queryCache: data.queryCache,
  });
  
  return NextResponse.json({ success: true });
}
```

---

## Vue 3 + Vite + TanStack Query

```
my-vue-app/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── monitoring/                      # 📊 Performance monitoring
│   │   └── [same structure as above]
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.vue
│   │   │   └── Card.vue
│   │   ├── layout/
│   │   │   ├── Header.vue
│   │   │   └── Footer.vue
│   │   ├── features/
│   │   │   ├── ProductList.vue
│   │   │   └── UserProfile.vue
│   │   └── PerformanceReporter.vue      # 📊 Performance report button
│   │
│   ├── composables/                     # Vue composables
│   │   ├── useProducts.ts               # TanStack Query composables
│   │   ├── useUser.ts
│   │   ├── usePerformanceMonitor.ts     # 📊 Performance tracking
│   │   ├── useComponentPerformance.ts   # 📊
│   │   └── useAutoReporting.ts          # 📊
│   │
│   ├── views/                           # Page components
│   │   ├── HomeView.vue
│   │   ├── ProductsView.vue
│   │   └── DashboardView.vue
│   │
│   ├── router/
│   │   └── index.ts                     # Vue Router
│   │
│   ├── stores/                          # Pinia stores (optional)
│   │   └── products.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── product.ts
│   │   └── user.ts
│   │
│   ├── App.vue                          # Main app component
│   ├── main.ts                          # 📊 Entry point - initialize monitoring here
│   └── style.css
│
├── .env
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files for Vue 3 + Vite

**`src/main.ts`** - Initialize monitoring here:
```typescript
import { createApp } from 'vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { initializeVueMonitoring } from './monitoring';
import App from './App.vue';
import router from './router';
import './style.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

const perfMonitor = initializeVueMonitoring();
perfMonitor.initializeQueryClient(queryClient);
perfMonitor.markHydrationStart();

const app = createApp(App);

app.use(router);
app.use(VueQueryPlugin, { queryClient });

app.mount('#app');

setTimeout(() => perfMonitor.markHydrationEnd(), 0);
```

**`src/composables/useProducts.ts`** - TanStack Query example:
```typescript
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });
}
```

**`src/composables/usePerformanceMonitor.ts`** - Performance composable:
```typescript
import { getPerformanceMonitor } from '~/monitoring';

export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor('vue');

  const downloadReport = () => {
    monitor.downloadReport();
  };

  const sendToAnalytics = async () => {
    await monitor.sendToAnalytics('/api/performance');
  };

  return {
    downloadReport,
    sendToAnalytics,
  };
}
```

**`src/components/PerformanceReporter.vue`**:
```vue
<template>
  <button @click="downloadReport">
    📊 Download Performance Report
  </button>
</template>

<script setup lang="ts">
import { usePerformanceMonitor } from '@/composables/usePerformanceMonitor';

const { downloadReport } = usePerformanceMonitor();
</script>
```

---

## Nuxt 3 + TanStack Query

```
my-nuxt-app/
├── public/
│   └── favicon.ico
│
├── server/
│   └── api/
│       └── performance.post.ts          # 📊 Analytics endpoint
│
├── monitoring/                          # 📊 Performance monitoring (in root, not src/)
│   └── [same structure as above]
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── features/
│   └── PerformanceReporter.vue
│
├── composables/                         # Auto-imported composables
│   ├── useProducts.ts
│   ├── usePerformanceMonitor.ts         # 📊
│   ├── useComponentPerformance.ts       # 📊
│   └── useAutoReporting.ts              # 📊
│
├── pages/
│   ├── index.vue
│   ├── products.vue
│   └── dashboard.vue
│
├── plugins/
│   └── performance-monitor.client.ts    # 📊 Initialize monitoring here
│
├── types/
│   ├── product.ts
│   └── user.ts
│
├── utils/
│   └── api.ts
│
├── .env
├── .gitignore
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Key Files for Nuxt 3

**`plugins/performance-monitor.client.ts`** - Initialize monitoring:
```typescript
import { defineNuxtPlugin } from '#app';
import { initializeVueMonitoring } from '~/monitoring';

export default defineNuxtPlugin((nuxtApp) => {
  const perfMonitor = initializeVueMonitoring();
  
  // Initialize with query client if available
  if (nuxtApp.$queryClient) {
    perfMonitor.initializeQueryClient(nuxtApp.$queryClient);
  }
  
  perfMonitor.markHydrationStart();
  
  nuxtApp.hook('app:mounted', () => {
    perfMonitor.markHydrationEnd();
  });
  
  return {
    provide: {
      perfMonitor,
    },
  };
});
```

**`server/api/performance.post.ts`** - Server endpoint:
```typescript
export default defineEventHandler(async (event) => {
  const data = await readBody(event);
  
  console.log('Performance data:', {
    url: data.url,
    framework: data.framework,
    vitals: data.webVitals,
    queryCache: data.queryCache,
  });
  
  return { success: true };
});
```

**`composables/usePerformanceMonitor.ts`** - Auto-imported:
```typescript
import { getPerformanceMonitor } from '~/monitoring';

export const usePerformanceMonitor = () => {
  const monitor = getPerformanceMonitor('vue');

  const downloadReport = () => {
    monitor.downloadReport();
  };

  const sendToAnalytics = async () => {
    await monitor.sendToAnalytics('/api/performance');
  };

  return {
    downloadReport,
    sendToAnalytics,
  };
};
```

---

## Common Shared Structure (All Projects)

### `src/lib/queryClient.ts` - Shared TanStack Query config:
```typescript
import { QueryClient } from '@tanstack/[react|vue]-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### `src/lib/api.ts` - API client:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  
  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
};
```

---

## Installation Checklist

### 1. Install Dependencies

**React:**
```bash
npm install web-vitals @tanstack/react-query
```

**Vue:**
```bash
npm install web-vitals @tanstack/vue-query
```

### 2. Copy Monitoring Folder

Copy the `monitoring/` folder to:
- **React/Next.js**: `src/monitoring/`
- **Vue/Vite**: `src/monitoring/`
- **Nuxt**: `monitoring/` (root level, not in src/)

### 3. Initialize in Entry Point

- **React/Vite**: `src/main.tsx`
- **Next.js**: `src/app/providers.tsx`
- **Vue/Vite**: `src/main.ts`
- **Nuxt**: `plugins/performance-monitor.client.ts`

### 4. Add Report Component

Place `PerformanceReporter` component in your layout or dashboard.

### 5. Create Analytics Endpoint (Optional)

- **Next.js**: `src/app/api/performance/route.ts`
- **Nuxt**: `server/api/performance.post.ts`

---

## Quick Reference

| Framework | Entry Point | Initialize Here | Report Component Location |
|-----------|-------------|----------------|---------------------------|
| **React + Vite** | `src/main.tsx` | Before `ReactDOM.render()` | `src/components/` |
| **Next.js App** | `src/app/providers.tsx` | In `useEffect` | `src/components/` |
| **Next.js Pages** | `pages/_app.tsx` | In `useEffect` | `src/components/` |
| **Vue + Vite** | `src/main.ts` | Before `app.mount()` | `src/components/` |
| **Nuxt 3** | `plugins/*.client.ts` | In plugin | `components/` |

---

## Tips

1. **Keep monitoring/ folder separate** - Don't mix with your app code
2. **Initialize early** - Before any rendering
3. **Use TypeScript** - Types are already included
4. **Create composables/hooks** - Reusable performance tracking
5. **Add to .gitignore**: `*.perf.md` (generated reports)
