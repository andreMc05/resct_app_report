/**
 * Vue.js Integration Example
 * 
 * This shows how to integrate performance monitoring
 * into Vue 3 applications using Composition API
 * 
 * Works with:
 * - Vue 3 Composition API
 * - Nuxt 3
 * - @tanstack/vue-query (Vue Query)
 */

import { onMounted, onUnmounted } from 'vue';
import { initializeVueMonitoring, getPerformanceMonitor } from './monitoring';

// ============================================================================
// Vue 3 + Vite Integration
// ============================================================================

// main.ts or main.js
import { createApp } from 'vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import App from './App.vue';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Initialize performance monitoring BEFORE creating the app
const perfMonitor = initializeVueMonitoring();

// Initialize TanStack Query monitoring
perfMonitor.initializeQueryClient(queryClient);

// Mark hydration start
perfMonitor.markHydrationStart();

const app = createApp(App);

// Install Vue Query
app.use(VueQueryPlugin, {
  queryClient,
});

app.mount('#app');

// Mark hydration end after mount
setTimeout(() => {
  perfMonitor.markHydrationEnd();
}, 0);

// ============================================================================
// Nuxt 3 Integration
// ============================================================================

// plugins/performance-monitor.client.ts
import { defineNuxtPlugin } from '#app';
import { initializeVueMonitoring, getPerformanceMonitor } from '~/monitoring';

export default defineNuxtPlugin((nuxtApp) => {
  const perfMonitor = initializeVueMonitoring();

  // Access Vue Query if using it
  if (nuxtApp.$queryClient) {
    perfMonitor.initializeQueryClient(nuxtApp.$queryClient);
  }

  // Mark hydration for SSR
  perfMonitor.markHydrationStart();

  nuxtApp.hook('app:mounted', () => {
    perfMonitor.markHydrationEnd();
  });

  // Provide monitor to components
  return {
    provide: {
      perfMonitor,
    },
  };
});

// ============================================================================
// Composable for Performance Reporting
// ============================================================================

// composables/usePerformanceMonitor.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { getPerformanceMonitor } from '~/monitoring';

export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor('vue');

  const downloadReport = () => {
    monitor.downloadReport({
      includeResourceDetails: true,
      includeApiDetails: true,
      includeLoAFDetails: true,
      groupResourcesByType: true,
      topResourcesCount: 10,
    });
  };

  const sendToAnalytics = async () => {
    await monitor.sendToAnalytics('/api/performance');
  };

  const getSession = () => {
    return monitor.getPerformanceSession();
  };

  return {
    downloadReport,
    sendToAnalytics,
    getSession,
  };
}

// ============================================================================
// Composable for Component Performance Tracking
// ============================================================================

// composables/useComponentPerformance.ts
import { onMounted, onUnmounted } from 'vue';

export function useComponentPerformance(componentName: string) {
  let startTime: number;

  onMounted(() => {
    startTime = performance.now();
  });

  onUnmounted(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.info(`[Component: ${componentName}] Lifetime: ${duration.toFixed(2)}ms`);
  });
}

// Usage in a component:
// <script setup>
// import { useComponentPerformance } from '~/composables/useComponentPerformance';
// 
// useComponentPerformance('ProductList');
// </script>

// ============================================================================
// Performance Report Component
// ============================================================================

// components/PerformanceReporter.vue
/*
<template>
  <div class="performance-reporter">
    <button @click="handleDownload" class="btn-download">
      📊 Download Performance Report
    </button>
    <button @click="handleSendAnalytics" class="btn-analytics">
      📤 Send to Analytics
    </button>
    <div v-if="reportGenerated" class="success-message">
      ✓ Report downloaded!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePerformanceMonitor } from '~/composables/usePerformanceMonitor';

const { downloadReport, sendToAnalytics } = usePerformanceMonitor();
const reportGenerated = ref(false);

const handleDownload = () => {
  downloadReport();
  reportGenerated.value = true;
  
  setTimeout(() => {
    reportGenerated.value = false;
  }, 3000);
};

const handleSendAnalytics = async () => {
  await sendToAnalytics();
  alert('Performance data sent to analytics!');
};
</script>

<style scoped>
.performance-reporter {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-download,
.btn-analytics {
  padding: 8px 16px;
  margin-right: 8px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  color: white;
}

.btn-download {
  background: #007bff;
}

.btn-analytics {
  background: #28a745;
}

.success-message {
  margin-top: 8px;
  color: #28a745;
  font-size: 12px;
}
</style>
*/

// ============================================================================
// Auto-reporting on Route Changes (Nuxt 3)
// ============================================================================

// composables/useAutoReporting.ts
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPerformanceMonitor } from '~/monitoring';

export function useAutoReporting() {
  const router = useRouter();
  const monitor = getPerformanceMonitor('vue');

  const sendData = () => {
    monitor.sendToAnalytics('/api/performance');
  };

  onMounted(() => {
    // Send data on page exit
    window.addEventListener('beforeunload', sendData);

    // Or send data on route change
    router.afterEach(() => {
      sendData();
    });
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', sendData);
  });
}

// ============================================================================
// TanStack Vue Query Integration
// ============================================================================

// composables/useQueryPerformance.ts
import { useQuery } from '@tanstack/vue-query';
import { getPerformanceMonitor } from '~/monitoring';

export function useQueryWithPerformance<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options = {}
) {
  const monitor = getPerformanceMonitor('vue');
  
  const result = useQuery({
    queryKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        const data = await queryFn();
        const duration = performance.now() - startTime;
        
        console.info(`[Query: ${JSON.stringify(queryKey)}] Duration: ${duration.toFixed(2)}ms`);
        
        return data;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`[Query: ${JSON.stringify(queryKey)}] Failed after ${duration.toFixed(2)}ms`, error);
        throw error;
      }
    },
    ...options,
  });

  return result;
}

// Usage:
// const { data, isLoading } = useQueryWithPerformance(
//   ['products'],
//   () => fetchProducts()
// );

// ============================================================================
// Nuxt 3 Server API Route for Analytics
// ============================================================================

// server/api/performance.post.ts
export default defineEventHandler(async (event) => {
  const performanceData = await readBody(event);
  
  // Log performance data
  console.log('Performance data received:', {
    url: performanceData.url,
    sessionId: performanceData.sessionId,
    framework: performanceData.framework,
    metrics: performanceData.webVitals.map((m: any) => `${m.name}: ${m.value}`),
  });

  // Store in database, send to analytics service, etc.
  // Example: await sendToExternalAnalytics(performanceData);

  return {
    success: true,
    timestamp: Date.now(),
  };
});

// ============================================================================
// App-wide Performance Plugin with Auto-reporting
// ============================================================================

// plugins/performance-auto-report.client.ts
import { defineNuxtPlugin } from '#app';
import { getPerformanceMonitor } from '~/monitoring';

export default defineNuxtPlugin((nuxtApp) => {
  const monitor = getPerformanceMonitor('vue');

  // Auto-send performance data after 10 seconds
  setTimeout(() => {
    monitor.sendToAnalytics('/api/performance');
  }, 10000);

  // Send on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      monitor.sendToAnalytics('/api/performance');
    });
  }
});

// ============================================================================
// Pinia Store Integration (Optional)
// ============================================================================

// stores/performance.ts
import { defineStore } from 'pinia';
import { getPerformanceMonitor } from '~/monitoring';

export const usePerformanceStore = defineStore('performance', {
  state: () => ({
    sessionData: null as any,
    isMonitoring: true,
  }),

  actions: {
    async generateReport() {
      const monitor = getPerformanceMonitor('vue');
      monitor.downloadReport();
    },

    async sendToAnalytics() {
      const monitor = getPerformanceMonitor('vue');
      await monitor.sendToAnalytics('/api/performance');
    },

    getSessionData() {
      const monitor = getPerformanceMonitor('vue');
      this.sessionData = monitor.getPerformanceSession();
      return this.sessionData;
    },

    clear() {
      const monitor = getPerformanceMonitor('vue');
      monitor.clear();
      this.sessionData = null;
    },
  },
});

// Usage in component:
// <script setup>
// import { usePerformanceStore } from '~/stores/performance';
// 
// const perfStore = usePerformanceStore();
// 
// const handleDownload = () => {
//   perfStore.generateReport();
// };
// </script>