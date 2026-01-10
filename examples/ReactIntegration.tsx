/**
 * React Integration Example - Standard React App + TanStack Query
 * 
 * This shows how to integrate the performance monitoring
 * into a standard React application with TanStack Query (React Query)
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeReactMonitoring, getPerformanceMonitor } from './monitoring';
import App from './App';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize monitoring BEFORE rendering
const perfMonitor = initializeReactMonitoring();

// Initialize TanStack Query monitoring
perfMonitor.initializeQueryClient(queryClient);

// Mark hydration start
perfMonitor.markHydrationStart();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

// Mark hydration end after initial render
setTimeout(() => {
  perfMonitor.markHydrationEnd();
}, 0);

/**
 * Performance Reporting Component
 * 
 * Add this component anywhere in your app to enable
 * report generation and download
 */
export function PerformanceReporter() {
  const [reportGenerated, setReportGenerated] = React.useState(false);

  const handleGenerateReport = () => {
    const monitor = getPerformanceMonitor('react');
    monitor.downloadReport({
      includeResourceDetails: true,
      includeApiDetails: true,
      includeLoAFDetails: true,
      groupResourcesByType: true,
      topResourcesCount: 10,
    });
    setReportGenerated(true);
  };

  const handleSendToAnalytics = async () => {
    const monitor = getPerformanceMonitor('react');
    await monitor.sendToAnalytics('/api/performance');
    alert('Performance data sent to analytics!');
  };

  const handleViewSession = () => {
    const monitor = getPerformanceMonitor('react');
    const session = monitor.getPerformanceSession();
    console.log('Current performance session:', session);
    
    // Show query cache stats if available
    if (session.queryCache) {
      console.log('TanStack Query Stats:', {
        totalQueries: session.queryCache.totalQueries,
        cacheHitRate: `${(session.queryCache.cacheHitRate * 100).toFixed(2)}%`,
        avgFetchDuration: `${session.queryCache.averageFetchDuration.toFixed(2)}ms`,
      });
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      zIndex: 9999,
      background: '#fff',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <button 
        onClick={handleGenerateReport}
        style={{
          padding: '8px 16px',
          marginRight: '8px',
          cursor: 'pointer',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        📊 Download Performance Report
      </button>
      <button 
        onClick={handleSendToAnalytics}
        style={{
          padding: '8px 16px',
          marginRight: '8px',
          cursor: 'pointer',
          background: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        📤 Send to Analytics
      </button>
      <button 
        onClick={handleViewSession}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
          background: '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        🔍 View Session
      </button>
      {reportGenerated && (
        <div style={{ marginTop: '8px', color: '#28a745', fontSize: '12px' }}>
          ✓ Report downloaded!
        </div>
      )}
    </div>
  );
}

/**
 * Hook for monitoring component-level performance
 */
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.info(`[Component: ${componentName}] Render time: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
}

/**
 * Hook for automatic performance reporting
 */
export function useAutoPerformanceReporting() {
  useEffect(() => {
    const monitor = getPerformanceMonitor('react');
    
    const sendData = () => {
      monitor.sendToAnalytics('/api/performance');
    };

    // Send data when user leaves the page
    window.addEventListener('beforeunload', sendData);
    
    // Or send data after a delay
    const timer = setTimeout(sendData, 10000); // 10 seconds after load

    return () => {
      window.removeEventListener('beforeunload', sendData);
      clearTimeout(timer);
    };
  }, []);
}

/**
 * Example: Custom query hook with performance tracking
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useQueryWithPerformance<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
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
}

/**
 * Example usage in a component:
 * 
 * function ProductList() {
 *   useComponentPerformance('ProductList');
 *   useAutoPerformanceReporting();
 *   
 *   const { data, isLoading } = useQueryWithPerformance(
 *     ['products'],
 *     () => fetchProducts()
 *   );
 *   
 *   return <div>Product List</div>;
 * }
 */

/**
 * Context Provider for Performance Monitoring
 */
import { createContext, useContext } from 'react';

const PerformanceContext = createContext<ReturnType<typeof getPerformanceMonitor> | null>(null);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const monitor = getPerformanceMonitor('react');

  return (
    <PerformanceContext.Provider value={monitor}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}

/**
 * Usage with Context:
 * 
 * // In App.tsx
 * <PerformanceProvider>
 *   <App />
 * </PerformanceProvider>
 * 
 * // In any component
 * function MyComponent() {
 *   const perfMonitor = usePerformance();
 *   
 *   const handleReport = () => {
 *     perfMonitor.downloadReport();
 *   };
 *   
 *   return <button onClick={handleReport}>Get Report</button>;
 * }
 */