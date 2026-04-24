// usePolling.js — drop this in frontend/src/hooks/usePolling.js
// Originally polled on interval. Now modified to just run on mount to stop typing interruptions.
import { useEffect, useRef } from "react";

const usePolling = (fetchFn) => {
  const savedFn = useRef(fetchFn);

  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    // Call immediately on mount, no interval
    savedFn.current();
  }, []);
};

export default usePolling;