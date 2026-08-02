import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `৳${num.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getExpiryStatus(expiryDate: string): 'safe' | 'warning' | 'danger' {
  const months = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 1) return 'danger';
  if (months < 6) return 'warning';
  return 'safe';
}

export function getExpiryLabel(expiryDate: string): string {
  const months = Math.round((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return 'Expires soon';
  return `${months} months`;
}
