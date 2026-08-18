import React, { useState } from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Usuario',
  size = 'md',
  status,
  alt,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const statusSizes = {
    xs: "w-1.5 h-1.5 ring-1",
    sm: "w-2 h-2 ring-1.5",
    md: "w-2.5 h-2.5 ring-2",
    lg: "w-3 h-3 ring-2",
    xl: "w-4 h-4 ring-2",
  };

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  // Generate deterministic initials and colors
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = (n: string) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-amber-600',
      'bg-rose-600',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const showImage = src && !hasError;
  const initials = getInitials(name);
  const bgClass = getBackgroundColor(name);

  return (
    <div className="relative inline-block shrink-0 select-none" {...props}>
      <div
        className={`rounded-full flex items-center justify-center font-bold font-display overflow-hidden shadow-sm ${sizes[size]} ${
          showImage ? 'bg-slate-100 dark:bg-slate-800' : `${bgClass} text-white`
        } ${className}`.trim()}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white dark:ring-slate-900 ${statusColors[status]} ${statusSizes[size]}`}
          aria-label={`Estado: ${status}`}
        />
      )}
    </div>
  );
};
