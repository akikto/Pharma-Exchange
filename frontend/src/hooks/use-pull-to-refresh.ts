import { useCallback, useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 72;
const MAIN_SCROLL_ID = 'main-content';

function getScrollContainer(): HTMLElement | null {
  return document.getElementById(MAIN_SCROLL_ID);
}

function getScrollTop(): number {
  const main = getScrollContainer();
  return main ? main.scrollTop : window.scrollY;
}

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function usePullToRefresh({ onRefresh, disabled }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

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
    if (getScrollTop() <= 0) {
      startY.current = e.touches[0]?.clientY ?? 0;
      startX.current = e.touches[0]?.clientX ?? 0;
      pulling.current = true;
    }
  }, [disabled, isRefreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || disabled || isRefreshing) return;
    if (getScrollTop() > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const deltaY = touch.clientY - startY.current;
    const deltaX = touch.clientX - startX.current;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    if (deltaY > 0) setPullDistance(Math.min(deltaY, PULL_THRESHOLD * 1.5));
  }, [disabled, isRefreshing]);

  const onTouchEnd = useCallback(() => {
    if (!pulling.current || disabled) return;
    if (pullDistanceRef.current >= PULL_THRESHOLD) void runRefresh();
    else {
      setPullDistance(0);
      pulling.current = false;
    }
  }, [disabled, runRefresh]);

  useEffect(() => {
    const main = getScrollContainer();
    if (!main || disabled) return;

    const onNativeTouchMove = (event: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;
      if (getScrollTop() > 0) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - startY.current;
      const deltaX = touch.clientX - startX.current;
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (deltaY > 0) event.preventDefault();
    };

    main.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    return () => main.removeEventListener('touchmove', onNativeTouchMove);
  }, [disabled, isRefreshing]);

  return {
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= PULL_THRESHOLD,
    runRefresh,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
