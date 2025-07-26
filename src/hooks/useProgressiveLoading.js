import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing progressive loading states
 * Provides smooth transitions between loading steps
 */
export const useProgressiveLoading = (loadingSteps = [], options = {}) => {
  const {
    stepDuration = 800,
    autoProgress = true,
    onStepComplete = null,
    onAllComplete = null
  } = options;

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stepData, setStepData] = useState({});

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= loadingSteps.length) {
        setIsComplete(true);
        if (onAllComplete) {
          onAllComplete();
        }
        return prev;
      }
      
      if (onStepComplete) {
        onStepComplete(next, loadingSteps[next]);
      }
      
      return next;
    });
  }, [loadingSteps, onStepComplete, onAllComplete]);

  const setStepResult = useCallback((stepIndex, data) => {
    setStepData(prev => ({
      ...prev,
      [stepIndex]: data
    }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsComplete(false);
    setStepData({});
  }, []);

  useEffect(() => {
    if (!autoProgress || isComplete || loadingSteps.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      nextStep();
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStep, isComplete, autoProgress, stepDuration, nextStep, loadingSteps.length]);

  return {
    currentStep,
    isComplete,
    stepData,
    currentStepData: loadingSteps[currentStep],
    progress: loadingSteps.length > 0 ? (currentStep / loadingSteps.length) * 100 : 0,
    nextStep,
    setStepResult,
    reset
  };
};

/**
 * Hook for managing async loading operations with caching
 */
export const useCachedData = (key, fetcher, options = {}) => {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    onError = null,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const getCacheKey = useCallback(() => `cached_${key}`, [key]);
  const getTimestampKey = useCallback(() => `timestamp_${key}`, [key]);

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      const timestamp = localStorage.getItem(getTimestampKey());
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < maxAge) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }
    return null;
  }, [getCacheKey, getTimestampKey, maxAge]);

  const setCachedData = useCallback((data) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(data));
      localStorage.setItem(getTimestampKey(), Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [getCacheKey, getTimestampKey]);

  const fetchWithRetry = useCallback(async (attemptNumber = 1) => {
    try {
      const result = await fetcher();
      setCachedData(result);
      setData(result);
      setError(null);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      console.error(`Fetch attempt ${attemptNumber} failed:`, err);
      
      if (attemptNumber < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attemptNumber));
        return fetchWithRetry(attemptNumber + 1);
      }
      
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [fetcher, retryAttempts, retryDelay, setCachedData, onError]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchWithRetry();
    } catch (err) {
      // Error already handled in fetchWithRetry
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithRetry]);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    try {
      await fetchWithRetry();
    } catch (err) {
      // Error already handled in fetchWithRetry
    } finally {
      setIsLoading(false);
    }
  }, [enabled, getCachedData, fetchWithRetry]);

  useEffect(() => {
    loadData();
  }, [key, enabled]); // Only depend on key and enabled

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refresh,
    refetch: refresh // Alias for refresh
  };
};

/**
 * Hook for managing form loading states
 */
export const useFormLoading = (initialState = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialState);

  const setLoading = useCallback((field, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [field]: isLoading
    }));
  }, []);

  const setMultipleLoading = useCallback((states) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const getLoadingFields = () => Object.keys(loadingStates).filter(key => loadingStates[key]);

  return {
    loadingStates,
    setLoading,
    setMultipleLoading,
    isLoading: (field) => Boolean(loadingStates[field]),
    isAnyLoading,
    getLoadingFields
  };
};

/**
 * Hook for managing tab loading states
 */
export const useTabLoading = () => {
  const [loadingTabs, setLoadingTabs] = useState(new Set());
  const [activeTab, setActiveTab] = useState(null);

  const setTabLoading = useCallback((tabKey, isLoading) => {
    setLoadingTabs(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(tabKey);
      } else {
        newSet.delete(tabKey);
      }
      return newSet;
    });
  }, []);

  const switchTab = useCallback((tabKey, loadData = null) => {
    setActiveTab(tabKey);
    
    if (loadData && typeof loadData === 'function') {
      setTabLoading(tabKey, true);
      Promise.resolve(loadData())
        .finally(() => {
          setTabLoading(tabKey, false);
        });
    }
  }, [setTabLoading]);

  const isTabLoading = useCallback((tabKey) => {
    return loadingTabs.has(tabKey);
  }, [loadingTabs]);

  return {
    activeTab,
    setActiveTab,
    switchTab,
    isTabLoading,
    setTabLoading
  };
};
