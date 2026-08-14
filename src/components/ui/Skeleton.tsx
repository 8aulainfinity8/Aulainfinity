import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  shape?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  shape = 'rect' 
}) => {
  const styles: React.CSSProperties = {
    width: width,
    height: height,
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'text' ? 'rounded h-4' : 'rounded-lg';

  return (
    <div 
      style={styles}
      className={`animate-pulse bg-gray-200 dark:bg-slate-700 ${shapeClass} ${className}`}
    />
  );
};
