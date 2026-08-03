import { useCallback, useRef, useState } from 'react';

const PULL_THRESHOLD = 72;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function usePullToRefresh({ onRefresh, disabled }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const runRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      pulling.current = false;
    }
  }, [disabled, isRefreshing, onRefresh]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (window.scrollY <= 0) {
      startY.current = e.touches[0]?.clientY ?? 0;
      pulling.current = true;
    }
  }, [disabled, isRefreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || disabled || isRefreshing) return;
    if (window.scrollY > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
    if (delta > 0) setPullDistance(Math.min(delta, PULL_THRESHOLD * 1.5));
  }, [disabled, isRefreshing]);

  const onTouchEnd = useCallback(() => {
    if (!pulling.current || disabled) return;
    if (pullDistance >= PULL_THRESHOLD) void runRefresh();
    else {
      setPullDistance(0);
      pulling.current = false;
    }
  }, [disabled, pullDistance, runRefresh]);

  return {
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= PULL_THRESHOLD,
    runRefresh,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
