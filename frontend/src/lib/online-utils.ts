export function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function subscribeToOnlineStatus(onChange: (online: boolean) => void): () => void {
  const handleChange = () => onChange(getIsOnline());
  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);
  return () => {
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
  };
}
