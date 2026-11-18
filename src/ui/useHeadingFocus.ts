import { useEffect, useRef } from 'react';

/**
 * Focuses the returned heading after mount when `enabled` (A-4): the button that changed the screen has
 * unmounted. tabIndex is set on the element here so the server markup stays a plain `<h1>`.
 */
export function useHeadingFocus(enabled: boolean): React.RefObject<HTMLHeadingElement | null> {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = heading.current;
    if (!enabled || element === null) return;
    element.tabIndex = -1;
    element.focus();
  }, [enabled]);
  return heading;
}
