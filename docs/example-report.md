# Web Performance Report

**Generated:** 1/10/2026, 10:30:45 AM  
**URL:** https://example.com/products  
**Session ID:** session_1736522445123_abc123xyz  
**User Agent:** Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Resources | 47 |
| Render-Blocking Resources | 3 |
| Total Transfer Size | 1.24 MB |
| Avg. Compression Ratio | 3.42x |
| API Calls | 8 |
| Avg. API Latency | 245.32ms |
| Long Frames (>50ms) | 12 |
| Total Blocking Time | 423.56ms |

---

## Core Web Vitals

### LCP (Largest Contentful Paint)

**Value:** 1847.50ms  
**Rating:** ✅ Good  
**Threshold:** Good < 2500ms, Poor > 4000ms

**Attribution:**
- Element: `img.hero-image`
- URL: `https://cdn.example.com/hero-1200x800.jpg`
- Time to First Byte: 156.23ms
- Resource Load Delay: 45.67ms
- Resource Load Time: 892.34ms
- Element Render Delay: 753.26ms

### CLS (Cumulative Layout Shift)

**Value:** 0.045  
**Rating:** ✅ Good  
**Threshold:** Good < 0.1, Poor > 0.25

**Attribution:**
- Largest Shift Element: `div.product-grid`
- Largest Shift Value: 0.032
- Largest Shift Time: 1234.56ms
- Load State: hydrated

### INP (Interaction to Next Paint)

**Value:** 156.78ms  
**Rating:** ✅ Good  
**Threshold:** Good < 200ms, Poor > 500ms

**Attribution:**
- Event Target: `button.add-to-cart`
- Event Type: click
- Input Delay: 12.34ms
- Processing Duration: 98.76ms
- Presentation Delay: 45.68ms

### FCP (First Contentful Paint)

**Value:** 892.34ms  
**Rating:** ✅ Good  
**Threshold:** Good < 1800ms, Poor > 3000ms

### TTFB (Time to First Byte)

**Value:** 156.23ms  
**Rating:** ✅ Good  
**Threshold:** Good < 800ms, Poor > 1800ms

---

## Navigation Timing

| Phase | Duration |
|-------|----------|
| DNS Lookup | 12.34ms |
| TCP Connection | 45.67ms |
| Time to First Byte | 156.23ms |
| Content Download | 234.56ms |
| DOM Processing | 567.89ms |
| **Total Page Load** | **1234.56ms** |

**Navigation Type:** navigate

---

## React Hydration Performance

**Duration:** 234.56ms  
**Components Hydrated:** 87  

**LCP Before Hydration:** 1234.56ms  
**LCP After Hydration:** 1847.50ms  
**LCP Delta:** 612.94ms  
**LCP Element:** `img.hero-image`

---

## Resource Performance

### Render-Blocking Resources (3)

| Resource | Type | Duration | Size |
|----------|------|----------|------|
| main.css | link | 245.67ms | 45.23 KB |
| vendor.js | script | 189.34ms | 234.56 KB |
| fonts.css | link | 123.45ms | 12.34 KB |

### Largest Resources (Top 10)

| Resource | Type | Size | Compression |
|----------|------|------|-------------|
| vendor.chunk.js | script | 456.78 KB | 3.45x |
| main.chunk.js | script | 234.56 KB | 3.67x |
| hero-1200x800.jpg | img | 187.65 KB | N/A |
| product-sprite.png | img | 123.45 KB | N/A |
| icons.woff2 | font | 87.65 KB | N/A |
| styles.css | link | 67.89 KB | 4.23x |
| analytics.js | script | 45.67 KB | 2.89x |
| tracking.js | script | 34.56 KB | 2.56x |
| polyfills.js | script | 23.45 KB | 3.12x |
| runtime.js | script | 12.34 KB | 3.89x |

### Slowest Resources (Top 10)

| Resource | Type | Duration | TTFB |
|----------|------|----------|------|
| https://api.example.com/products | fetch | 456.78ms | 234.56ms |
| vendor.chunk.js | script | 345.67ms | 123.45ms |
| main.chunk.js | script | 234.56ms | 98.76ms |
| hero-1200x800.jpg | img | 189.34ms | 67.89ms |
| styles.css | link | 167.89ms | 56.78ms |
| product-sprite.png | img | 145.67ms | 45.67ms |
| icons.woff2 | font | 123.45ms | 34.56ms |
| analytics.js | script | 98.76ms | 23.45ms |
| tracking.js | script | 87.65ms | 21.34ms |
| polyfills.js | script | 76.54ms | 19.23ms |

### Resources by Type

| Type | Count | Total Size | Avg Duration |
|------|-------|-----------|--------------|
| script | 12 | 892.34 KB | 134.56ms |
| img | 15 | 567.89 KB | 98.76ms |
| link | 8 | 234.56 KB | 87.65ms |
| fetch | 8 | 123.45 KB | 245.32ms |
| font | 4 | 156.78 KB | 76.54ms |

---

## API Performance

**Total API Calls:** 8  
**Average Latency:** 245.32ms  
**Average TTFB:** 167.89ms  
**LCP-Blocking Calls:** 1  
**INP-Blocking Calls:** 0  

### Slowest API Calls (Top 10)

| Endpoint | Method | Duration | TTFB | Blocked LCP | Blocked INP |
|----------|--------|----------|------|-------------|-------------|
| /api/products | GET | 456.78ms | 234.56ms | ⚠️ | ✓ |
| /api/recommendations | GET | 345.67ms | 189.34ms | ✓ | ✓ |
| /api/reviews | GET | 287.65ms | 156.78ms | ✓ | ✓ |
| /api/user/preferences | GET | 234.56ms | 123.45ms | ✓ | ✓ |
| /api/cart | GET | 189.34ms | 98.76ms | ✓ | ✓ |
| /api/wishlist | GET | 167.89ms | 87.65ms | ✓ | ✓ |
| /api/analytics/track | POST | 123.45ms | 67.89ms | ✓ | ✓ |
| /api/session | POST | 98.76ms | 45.67ms | ✓ | ✓ |

---

## Long Animation Frames

**Total Long Frames:** 12  
**Total Blocking Time:** 423.56ms  
**Average Frame Duration:** 78.92ms  

### Worst Long Frames (Top 10)

| Start Time | Duration | Blocking Time | Scripts |
|------------|----------|---------------|---------|
| 1234.56ms | 234.56ms | 184.56ms | vendor.chunk.js, react-dom.production.min.js |
| 2345.67ms | 189.34ms | 139.34ms | main.chunk.js |
| 3456.78ms | 167.89ms | 117.89ms | analytics.js |
| 4567.89ms | 145.67ms | 95.67ms | tracking.js |
| 5678.90ms | 123.45ms | 73.45ms | polyfills.js |
| 6789.01ms | 98.76ms | 48.76ms | runtime.js |
| 7890.12ms | 87.65ms | 37.65ms | vendor.chunk.js |
| 8901.23ms | 76.54ms | 26.54ms | main.chunk.js |
| 9012.34ms | 67.89ms | 17.89ms | react-dom.production.min.js |
| 10123.45ms | 56.78ms | 6.78ms | analytics.js |

---

## Recommendations

- **Great job!** All key metrics are within acceptable ranges. Continue monitoring to maintain performance.
