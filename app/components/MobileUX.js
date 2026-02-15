/**
 * Mobile UX Improvements
 * Utilities and components for better mobile experience
 */

/**
 * Touch-friendly button sizes
 * Minimum 44x44px for accessibility
 */
export const touchTargetStyles = {
  minHeight: '44px',
  minWidth: '44px',
  padding: '0.75rem 1rem',
  fontSize: '1rem'
};

/**
 * Pull-to-Refresh Component
 */
export function usePullToRefresh(onRefresh, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (window.scrollY !== 0 || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      if (distance > 0 && distance < threshold * 2) {
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      startY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh, threshold]);

  return { pullDistance, isRefreshing };
}

export function PullToRefreshIndicator({ distance, isRefreshing }) {
  if (distance === 0 && !isRefreshing) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: `${Math.min(distance, 80)}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.95)',
      borderBottom: '1px solid rgba(98, 73, 24, 0.2)',
      zIndex: 1000,
      transition: isRefreshing ? 'all 0.3s ease' : 'none'
    }}>
      {isRefreshing ? (
        <div style={{ fontSize: '1.5rem' }}>⏳ Refreshing...</div>
      ) : (
        <div style={{ 
          fontSize: '1.5rem',
          opacity: Math.min(distance / 80, 1),
          transform: `rotate(${distance * 4}deg)`
        }}>
          ↓
        </div>
      )}
    </div>
  );
}

/**
 * Swipe Gesture Hook
 */
export function useSwipeGesture({ 
  onSwipeLeft, 
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50 
}) {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    touchEnd.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = () => {
    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe (prioritize if both directions exceed threshold)
    if (absX > absY && absX > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    // Vertical swipe
    else if (absY > threshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * SwipeableItem - Swipe to reveal actions
 */
import { useState, useRef } from 'react';

export function SwipeableItem({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  leftAction = { icon: '✓', color: '#22c55e', label: 'Complete' },
  rightAction = { icon: '✕', color: '#ef4444', label: 'Delete' }
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const maxSwipe = 100;
  const threshold = 60;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    const newOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (offset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setOffset(0);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Left action (revealed when swiping right) */}
      {onSwipeRight && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: maxSwipe,
          background: leftAction.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          opacity: Math.min(offset / threshold, 1)
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>{leftAction.icon}</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {leftAction.label}
            </div>
          </div>
        </div>
      )}

      {/* Right action (revealed when swiping left) */}
      {onSwipeLeft && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: maxSwipe,
          background: rightAction.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          opacity: Math.min(Math.abs(offset) / threshold, 1)
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>{rightAction.icon}</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {rightAction.label}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          background: 'white'
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Mobile-optimized CSS utilities
 */
export const mobileStyles = {
  // Prevent text selection on touch
  noSelect: {
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    userSelect: 'none'
  },
  
  // Smooth scrolling
  smoothScroll: {
    WebkitOverflowScrolling: 'touch',
    overflowY: 'auto'
  },
  
  // Tap highlight color
  noTapHighlight: {
    WebkitTapHighlightColor: 'transparent'
  },
  
  // Safe area insets for notched phones
  safeArea: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)'
  }
};

/**
 * Responsive font sizes
 */
export const responsiveText = {
  xs: 'clamp(0.75rem, 2vw, 0.875rem)',
  sm: 'clamp(0.875rem, 2.5vw, 1rem)',
  base: 'clamp(1rem, 3vw, 1.125rem)',
  lg: 'clamp(1.125rem, 3.5vw, 1.25rem)',
  xl: 'clamp(1.25rem, 4vw, 1.5rem)',
  '2xl': 'clamp(1.5rem, 5vw, 2rem)',
  '3xl': 'clamp(2rem, 6vw, 2.5rem)'
};
