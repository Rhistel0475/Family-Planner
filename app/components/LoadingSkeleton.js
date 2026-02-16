'use client';

/**
 * LoadingSkeleton - Animated placeholder for loading content
 * 
 * Usage:
 * <LoadingSkeleton variant="card" />
 * <LoadingSkeleton variant="text" width="60%" />
 * <LoadingSkeleton variant="circle" size={80} />
 */
export default function LoadingSkeleton({ 
  variant = 'text', 
  width = '100%', 
  height,
  size,
  count = 1,
  className = ''
}) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getStyles = () => {
    const baseStyles = {
      background: 'linear-gradient(90deg, #f0e5cf 0%, #faf6ed 50%, #f0e5cf 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      borderRadius: '6px',
      marginBottom: count > 1 ? '0.5rem' : '0'
    };

    switch (variant) {
      case 'text':
        return {
          ...baseStyles,
          width: width,
          height: height || '1rem'
        };
      
      case 'title':
        return {
          ...baseStyles,
          width: width,
          height: height || '2rem',
          borderRadius: '8px'
        };
      
      case 'card':
        return {
          ...baseStyles,
          width: width,
          height: height || '200px',
          borderRadius: '10px'
        };
      
      case 'circle':
        return {
          ...baseStyles,
          width: size || '40px',
          height: size || '40px',
          borderRadius: '50%'
        };
      
      case 'button':
        return {
          ...baseStyles,
          width: width || '120px',
          height: height || '40px',
          borderRadius: '8px'
        };
      
      default:
        return baseStyles;
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      
      {skeletons.map((_, index) => (
        <div 
          key={index}
          className={className}
          style={getStyles()}
          aria-label="Loading..."
          role="status"
        />
      ))}
    </>
  );
}

/**
 * Pre-built skeleton layouts for common use cases
 */

export function ChoreCardSkeleton() {
  return (
    <div style={{
      background: '#fff59d',
      borderRadius: 10,
      border: '1px solid rgba(98, 73, 24, 0.2)',
      padding: '1.5rem',
      boxShadow: '0 10px 20px rgba(70, 45, 11, 0.2)'
    }}>
      <LoadingSkeleton variant="title" width="70%" />
      <div style={{ marginTop: '1rem' }}>
        <LoadingSkeleton variant="text" width="100%" />
        <LoadingSkeleton variant="text" width="85%" />
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <LoadingSkeleton variant="button" width="100px" />
        <LoadingSkeleton variant="button" width="100px" />
      </div>
    </div>
  );
}

export function MemberCardSkeleton() {
  return (
    <div style={{
      background: '#fff59d',
      borderRadius: 10,
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <LoadingSkeleton variant="circle" size={80} />
      </div>
      <LoadingSkeleton variant="title" width="60%" height="1.5rem" />
      <div style={{ marginTop: '1rem' }}>
        <LoadingSkeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

export function ListItemSkeleton({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(98, 73, 24, 0.2)'
        }}>
          <LoadingSkeleton variant="text" width="90%" />
          <div style={{ marginTop: '0.5rem' }}>
            <LoadingSkeleton variant="text" width="60%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
