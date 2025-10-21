import { useEffect, useRef, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generic debounced callback function type
 */
type DebouncedCallback<T extends unknown[]> = (...args: T) => void;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook that creates a debounced version of a callback function
 *
 * The debounced function will delay invoking the callback until after
 * the specified delay has elapsed since the last time it was called.
 *
 * Features:
 * - Automatically cleans up pending timeouts on unmount
 * - Updates callback reference without resetting the timer
 * - Type-safe with generics
 * - Memory leak prevention
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * const handleSearch = useDebounce((value: string) => {
 *   // API call
 *   fetchResults(value);
 * }, 500);
 *
 * // In component:
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebounce<T extends unknown[]>(callback: DebouncedCallback<T>, delay = 300): DebouncedCallback<T> {
  // Store timeout ID for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callback in ref to avoid re-creating debounced function when callback changes
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes (without resetting the timer)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Create debounced callback
  const debouncedCallback = useCallback(
    (...args: T) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}
