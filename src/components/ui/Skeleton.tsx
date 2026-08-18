import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  shape?: 'text' | 'rect' | 'circle' | 'avatar' | 'card' | 'table-row';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  shape = 'rect',
  count = 1,
}) => {
  const styles: React.CSSProperties = {
    width: width,
    height: height,
  };

  const shapeClass = 
    shape === 'circle' ? 'rounded-full' : 
    shape === 'avatar' ? 'rounded-full aspect-square w-10 h-10' :
    shape === 'text' ? 'rounded-md h-4' : 
    shape === 'card' ? 'rounded-2xl h-48 w-full' :
    shape === 'table-row' ? 'rounded-xl h-12 w-full' :
    'rounded-xl';

  const renderSingle = (key: number) => (
    <div 
      key={key}
      style={styles}
      className={`animate-pulse bg-slate-200 dark:bg-slate-700/70 ${shapeClass} ${className}`.trim()}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: count }).map((_, i) => renderSingle(i))}
      </div>
    );
  }

  return renderSingle(0);
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-premium space-y-4 ${className}`.trim()}>
    <div className="flex items-center justify-between">
      <Skeleton shape="text" width="40%" height={20} />
      <Skeleton shape="circle" width={32} height={32} />
    </div>
    <Skeleton shape="text" width="70%" height={14} />
    <Skeleton shape="text" width="90%" height={14} />
    <div className="pt-2 flex justify-between items-center">
      <Skeleton shape="text" width="30%" height={16} />
      <Skeleton shape="rect" width={80} height={32} className="rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ columns = 4, className = '' }) => (
  <div className={`flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-4 ${className}`.trim()}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} shape="text" width={i === 0 ? "30%" : "20%"} height={16} />
    ))}
  </div>
);

