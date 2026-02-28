// usePolling.js — drop this in frontend/src/hooks/usePolling.js
// Usage: usePolling(fetchFn, 10000) — calls fetchFn every 10 seconds automatically
import { useEffect, useRef } from "react";

const usePolling = (fetchFn, intervalMs = 10000) => {
  const savedFn = useRef(fetchFn);

  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    // Call immediately on mount
    savedFn.current();

    const id = setInterval(() => {
      savedFn.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
};

export default usePolling;