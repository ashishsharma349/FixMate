
import { useEffect, useRef } from "react";

const usePolling = (fetchFn) => {
  const savedFn = useRef(fetchFn);

  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {

    savedFn.current();
  }, []);
};

export default usePolling;