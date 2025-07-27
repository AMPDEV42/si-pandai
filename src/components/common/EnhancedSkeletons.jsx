import React from 'react';

/**
 * Enhanced skeleton components for better user experience
 */

export const EmployeeCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-lg bg-white/5 border border-white/10 animate-pulse"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-white/10 rounded w-48"></div>
                <div className="h-6 bg-white/10 rounded-full w-20"></div>
              </div>
              <div className="h-4 bg-white/10 rounded w-32"></div>
              <div className="flex space-x-4">
                <div className="h-3 bg-white/10 rounded w-24"></div>
                <div className="h-3 bg-white/10 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StepperSkeleton = ({ steps = 4 }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: steps }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-16 mt-2 animate-pulse"></div>
          </div>
          {i < steps - 1 && (
            <div className="flex-1 h-px bg-white/10 mx-4 animate-pulse"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const StatCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-lg bg-white/5 border border-white/10 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-6 h-6 bg-white/10 rounded"></div>
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
          </div>
          <div className="h-8 bg-white/10 rounded w-16 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
};

export const SubmissionCardSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-lg bg-white/5 border border-white/10 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-5 bg-white/10 rounded w-48"></div>
                <div className="h-6 bg-white/10 rounded-full w-20"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-white/10 rounded w-32"></div>
                <div className="h-4 bg-white/10 rounded w-28"></div>
              </div>
              <div className="h-4 bg-white/10 rounded w-64"></div>
            </div>
            <div className="h-8 bg-white/10 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FormFieldSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-white/10 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

export const TabSkeletonWrapper = ({ children, isLoading }) => {
  if (!isLoading) return children;
  
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded w-40"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-white/10 rounded mt-0.5"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                  <div className="h-4 bg-white/10 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded w-40"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-white/10 rounded mt-0.5"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-28"></div>
                  <div className="h-4 bg-white/10 rounded w-36"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProgressiveStepper = ({ currentStep, totalSteps, isComplete }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                i < currentStep || isComplete
                  ? 'bg-blue-600 text-white'
                  : i === currentStep
                  ? 'bg-blue-600/20 text-blue-400 ring-2 ring-blue-600 animate-pulse'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {i < currentStep || isComplete ? '✓' : i + 1}
            </div>
            <div className={`text-xs mt-2 transition-colors ${
              i <= currentStep ? 'text-white' : 'text-gray-400'
            }`}>
              Step {i + 1}
            </div>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`flex-1 h-px mx-4 transition-all duration-300 ${
                i < currentStep ? 'bg-blue-600' : 'bg-white/10'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const LoadingStateWithProgress = ({ 
  type = 'default', 
  message = 'Memuat...', 
  progress = null,
  subMessage = null 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-white/20 border-t-blue-600 rounded-full animate-spin"></div>
        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-white font-medium">{message}</p>
        {subMessage && (
          <p className="text-gray-400 text-sm mt-1">{subMessage}</p>
        )}
      </div>
      {progress !== null && (
        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
