/**
 * Next.js Integration Example
 * 
 * This shows how to integrate performance monitoring
 * into a Next.js application (both Pages Router and App Router)
 */

// ============================================================================
// App Router Integration (Next.js 13+)
// ============================================================================

// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring, getPerformanceMonitor } from '../monitoring';

export function PerformanceMonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize on client side only
    const monitor = initializePerformanceMonitoring();
    
    // Mark hydration for App Router
    monitor.markHydrationStart();
    
    // After React hydration completes
    const timer = setTimeout(() => {
      monitor.markHydrationEnd();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}

// Usage in app/layout.tsx:
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body>
//         <PerformanceMonitoringProvider>
//           {children}
//         </PerformanceMonitoringProvider>
//       </body>
//     </html>
//   );
// }

// ============================================================================
// Pages Router Integration (Next.js 12 and earlier)
// ============================================================================

// pages/_app.tsx
import { useEffect } from 'react';
import { initializePerformanceMonitoring, getPerformanceMonitor } from '../monitoring';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize monitoring
    const monitor = initializePerformanceMonitoring();
    
    // Mark hydration
    monitor.markHydrationStart();
    
    const timer = setTimeout(() => {
      monitor.markHydrationEnd();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return <Component {...pageProps} />;
}

// ============================================================================
// Custom _document.tsx for SSR/SSG tracking
// ============================================================================

// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Mark server-side render completion */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.__PERF_SSR_END__ = Date.now();
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

// ============================================================================
// API Route for collecting performance data
// ============================================================================

// pages/api/performance.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const performanceData = req.body;
    
    // Store in your database, send to analytics, etc.
    console.log('Performance data received:', {
      url: performanceData.url,
      sessionId: performanceData.sessionId,
      metrics: performanceData.webVitals.map((m: any) => `${m.name}: ${m.value}`),
    });

    // Example: Send to external analytics service
    // await fetch('https://your-analytics-service.com/collect', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(performanceData),
    // });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing performance data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// Client-side hook for automatic reporting
// ============================================================================

// hooks/usePerformanceReporting.ts
import { useEffect } from 'react';
import { getPerformanceMonitor } from '../monitoring';

export function usePerformanceReporting() {
  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    // Automatically send data after page interaction
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

// Usage in any page:
// export default function HomePage() {
//   usePerformanceReporting();
//   
//   return <div>Home Page</div>;
// }

// ============================================================================
// Server-side performance tracking (Edge Runtime)
// ============================================================================

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  const duration = Date.now() - start;
  
  // Add server timing header
  response.headers.set('Server-Timing', `middleware;dur=${duration}`);
  
  return response;
}

export const config = {
  matcher: '/:path*',
};