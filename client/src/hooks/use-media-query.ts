import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting if a media query matches
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the match state; false during SSR
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Create a MediaQueryList object
    const media = window.matchMedia(query);
    
    // Set the initial value
    setMatches(media.matches);

    // Define callback to handle changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the callback as a listener for changes to the media query
    media.addEventListener('change', listener);

    // Clean up function
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]); // Re-run if the query changes

  return matches;
}
