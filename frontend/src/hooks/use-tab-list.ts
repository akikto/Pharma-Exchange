import { useCallback, type KeyboardEvent } from 'react';

export function useTabListKeyboard<T extends string>(
  tabs: readonly T[],
  activeTab: T,
  setTab: (tab: T) => void,
) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const index = tabs.indexOf(activeTab);
      if (index < 0) return;

      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex === null) return;
      event.preventDefault();
      setTab(tabs[nextIndex]!);
    },
    [activeTab, setTab, tabs],
  );
}
