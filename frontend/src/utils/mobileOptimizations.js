/**
 * Mobile-specific performance optimizations
 * These utilities help optimize React apps for mobile devices
 */

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if user is on slow connection
 */
export function isSlowConnection() {
  if (typeof navigator === 'undefined' || !navigator.connection) return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Reduce motion for users who prefer it
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Optimize image URL based on device
 * Returns appropriately sized image for mobile/desktop
 */
export function getOptimizedImageUrl(url, options = {}) {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // If using a CDN that supports image optimization, add parameters
  // Example: Cloudinary, Imgix, etc.
  // This is a placeholder - modify based on your CDN
  
  const dpr = getDevicePixelRatio();
  const isMobile = isMobileDevice();
  
  // Calculate optimal dimensions
  const optimalWidth = width ? Math.ceil(width * dpr) : undefined;
  const optimalHeight = height ? Math.ceil(height * dpr) : undefined;
  
  // For mobile, reduce quality slightly
  const optimalQuality = isMobile ? Math.min(quality, 75) : quality;
  
  // Return URL with optimization params (modify based on your setup)
  return url; // Placeholder - implement based on your image CDN
}

/**
 * Lazy load component based on network speed
 * Returns different components for fast/slow connections
 */
export function adaptiveLoad(fastComponent, lightComponent) {
  return isSlowConnection() ? lightComponent : fastComponent;
}

/**
 * Get optimal chunk size based on device
 */
export function getOptimalChunkSize() {
  const isMobile = isMobileDevice();
  const isSlow = isSlowConnection();
  
  if (isSlow) return 50 * 1024; // 50KB for slow connections
  if (isMobile) return 100 * 1024; // 100KB for mobile
  return 200 * 1024; // 200KB for desktop
}

/**
 * Viewport-based conditional rendering
 * Only render component when it might be visible soon
 */
export class ViewportRenderer {
  constructor(threshold = 1.5) {
    this.threshold = threshold; // screens away from viewport
    this.viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  }
  
  shouldRender(element) {
    if (typeof window === 'undefined' || !element) return true;
    
    const rect = element.getBoundingClientRect();
    const offset = this.viewportHeight * this.threshold;
    
    return (
      rect.top < this.viewportHeight + offset &&
      rect.bottom > -offset
    );
  }
}

/**
 * Battery-aware optimizations
 * Reduce animations/effects when battery is low
 */
export async function isBatteryLow() {
  if (typeof navigator === 'undefined' || !navigator.getBattery) return false;
  
  try {
    const battery = await navigator.getBattery();
    return battery.level < 0.2 && !battery.charging;
  } catch {
    return false;
  }
}

/**
 * Resource timing check
 * Determine if resources are loading slowly
 */
export function getResourceLoadTime(resourceUrl) {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const resources = window.performance.getEntriesByType('resource');
  const resource = resources.find(r => r.name.includes(resourceUrl));
  
  return resource ? resource.duration : null;
}

/**
 * Memory usage check (Chrome only)
 */
export function isMemoryConstrained() {
  if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
    return false;
  }
  
  const memory = window.performance.memory;
  const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  
  return usageRatio > 0.9; // 90% memory usage
}

/**
 * Adaptive quality settings
 * Returns optimal settings based on device capabilities
 */
export function getAdaptiveQuality() {
  const isMobile = isMobileDevice();
  const isSlow = isSlowConnection();
  const lowMemory = isMemoryConstrained();
  
  return {
    imageQuality: isMobile ? 75 : 85,
    animationDuration: (isSlow || lowMemory) ? 150 : 300,
    enableAnimations: !prefersReducedMotion() && !lowMemory,
    enableShadows: !isMobile && !lowMemory,
    enableBlur: !isMobile && !lowMemory,
    lazyLoadOffset: isSlow ? '10px' : '50px',
    chunkSize: getOptimalChunkSize(),
  };
}

/**
 * Schedule non-critical work during idle time
 */
export function scheduleIdleWork(callback) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  
  const requestIdleCallback = window.requestIdleCallback || setTimeout;
  requestIdleCallback(callback, { timeout: 2000 });
}

/**
 * Save data mode detection
 */
export function isSaveDataEnabled() {
  if (typeof navigator === 'undefined' || !navigator.connection) return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connection.saveData === true;
}
