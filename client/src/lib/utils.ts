import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge.
 * This allows conditional classes and properly handles Tailwind CSS conflicts.
 *
 * @example
 * cn('p-4', 'bg-red-500', isActive && 'bg-blue-500')
 * // If isActive is true, returns 'p-4 bg-blue-500' (not 'p-4 bg-red-500 bg-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
