import { type ClassValue, clsx } from 'clsx';

/**
 * Combines class names using clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date and time for display
 */
export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate days until a deadline
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if a deadline is approaching (within 7 days)
 */
export function isDeadlineApproaching(date: Date | string): boolean {
  const days = daysUntil(date);
  return days > 0 && days <= 7;
}

/**
 * Check if a deadline has passed
 */
export function isDeadlinePassed(date: Date | string): boolean {
  return daysUntil(date) < 0;
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Download a file from a URL or Blob
 */
export function downloadFile(content: Blob | string, filename: string) {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: 'text/plain;charset=utf-8' })
    : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
