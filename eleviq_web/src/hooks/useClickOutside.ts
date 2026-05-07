'use client';

import { useEffect, RefObject } from 'react';

/**
 * Hook that detects clicks outside of the referenced element
 * and calls the provided callback.
 */
export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    callback: () => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        // Use mousedown for faster response
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, callback, enabled]);
}
