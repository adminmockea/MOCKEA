import React from 'react';

/**
 * Universal Base Skeleton component with GPU-accelerated shimmer effect.
 * Supports arbitrary dimensions, shapes (rounded, circular, text), and custom classes.
 */
export default function Skeleton({
  className = '',
  variant = 'rounded', // 'text' | 'circular' | 'rounded' | 'rectangle'
  width,
  height,
  style = {},
}) {
  let shapeClass = 'rounded-xl';

  if (variant === 'circular') {
    shapeClass = 'rounded-full';
  } else if (variant === 'text') {
    shapeClass = 'rounded-md h-4 my-1';
  } else if (variant === 'rectangle') {
    shapeClass = 'rounded-none';
  }

  const computedStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`shimmer-effect bg-slate-200/80 dark:bg-slate-700/60 ${shapeClass} ${className}`}
      style={computedStyle}
    />
  );
}
