import { useState, useEffect, useRef } from 'react';
import { kGepStatusUrl } from '../../shared/consts';

export type GepHealthState = 0 | 1 | 2 | 3;

interface GepStatusResult {
  state: GepHealthState;
  loading: boolean;
  error: boolean;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useGepStatus(): GepStatusResult {
  const [state, setState] = useState<GepHealthState>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(kGepStatusUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!mountedRef.current) return;
        const gepState = (
          typeof data?.state === 'number' ? data.state : 0
        ) as GepHealthState;
        setState(gepState);
        setError(false);
      } catch {
        if (!mountedRef.current) return;
        setError(true);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  return { state, loading, error };
}

export function gepStateLabel(state: GepHealthState, error: boolean): string {
  if (error) return 'Unknown';
  switch (state) {
    case 1:
      return 'Operational';
    case 2:
      return 'Partial Issues';
    case 3:
      return 'Unavailable';
    default:
      return 'Unknown';
  }
}

export function gepStateClass(state: GepHealthState, error: boolean): string {
  if (error) return 'gep-status--unknown';
  switch (state) {
    case 1:
      return 'gep-status--green';
    case 2:
      return 'gep-status--yellow';
    case 3:
      return 'gep-status--red';
    default:
      return 'gep-status--unknown';
  }
}
