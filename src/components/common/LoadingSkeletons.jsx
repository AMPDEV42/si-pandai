/**
 * Professional Loading Skeleton Components
 * Provides smooth loading states for better UX
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Base skeleton component
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-200/20 via-gray-300/30 to-gray-200/20 bg-[length:200%_100%]",
        "animate-[shimmer_1.5s_ease-in-out_infinite]",
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
      {...props}
    />
  );
};

// Dashboard statistics skeleton
export const StatCardSkeleton = () => (
  <div className="glass-effect border-white/20 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

// Dashboard stats grid skeleton
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// Submission list skeleton
export const SubmissionListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Table header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton = () => (
  <div className="space-y-6">
    {/* Form header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Form fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    
    {/* Form buttons */}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="glass-effect border-white/20 rounded-lg p-6">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

// Notification skeleton
export const NotificationSkeleton = ({ count = 3 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-3">
        <div className="flex items-start">
          <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
          <div className="ml-3 flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Page loading skeleton
export const PageSkeleton = () => (
  <div className="space-y-8">
    {/* Page header */}
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
    
    {/* Stats section */}
    <DashboardStatsSkeleton />
    
    {/* Main content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <CardSkeleton />
      </div>
      <div>
        <CardSkeleton />
      </div>
    </div>
  </div>
);

// Loading overlay
export const LoadingOverlay = ({ isLoading, children }) => {
  if (!isLoading) return children;
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
          <span className="text-white font-medium">Memuat...</span>
        </div>
      </div>
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    </div>
  );
};

// Lazy loading wrapper
export const LazyLoadWrapper = ({ isLoading, skeleton: SkeletonComponent, children }) => {
  return isLoading ? <SkeletonComponent /> : children;
};

export default {
  Skeleton,
  StatCardSkeleton,
  DashboardStatsSkeleton,
  SubmissionListSkeleton,
  TableSkeleton,
  FormSkeleton,
  CardSkeleton,
  NotificationSkeleton,
  PageSkeleton,
  LoadingOverlay,
  LazyLoadWrapper
};
