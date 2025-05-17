import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency
 * @param amount The amount to format (in the smallest currency unit, e.g. cents)
 * @param currency The currency code (defaults to USD)
 * @param locale The locale (defaults to en-US)
 */
export function currencyFormatter(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  // Convert from smallest unit (e.g., cents) to standard unit (e.g., dollars)
  const standardAmount = amount / 100

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(standardAmount)
} 