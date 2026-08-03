import { useEffect, useState } from 'react';
import { getIsOnline, subscribeToOnlineStatus } from '@/lib/online-utils';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(getIsOnline);

  useEffect(() => subscribeToOnlineStatus(setIsOnline), []);

  return isOnline;
}
