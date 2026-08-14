import React from 'react';
import { Skeleton } from './Skeleton';

export const RequestSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" width={48} height={48} />
          <div className="space-y-2">
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton width={100} height={36} />
        <Skeleton width={100} height={36} />
      </div>
    </div>
  );
};
