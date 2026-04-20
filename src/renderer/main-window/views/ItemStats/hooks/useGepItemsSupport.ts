import { useState, useEffect } from 'react';

const MIN_GEP_VERSION_FOR_ITEMS = 267;

/**
 * Checks whether the current GEP version supports the items feature
 * (match_info.items requires GEP 267.0+).
 */
export function useGepItemsSupport(): {
  supported: boolean | null;
  gepVersion: string | null;
} {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [gepVersion, setGepVersion] = useState<string | null>(null);

  useEffect(() => {
    const handler = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;

        if (payload?.type === 'gep-version-info') {
          const version = payload.data?.public_version ?? payload.data?.local_version;
          if (version) {
            setGepVersion(version);
            const majorVersion = parseInt(String(version).split('.')[0], 10);
            setSupported(majorVersion >= MIN_GEP_VERSION_FOR_ITEMS);
          }
        }
      } catch {
        // Ignore
      }
    };

    overwolf.windows.onMessageReceived.addListener(handler);

    // Also try reading from localStorage if the background has cached it
    try {
      const cached = localStorage.getItem('dl_gep_version');
      if (cached) {
        setGepVersion(cached);
        const majorVersion = parseInt(cached.split('.')[0], 10);
        setSupported(majorVersion >= MIN_GEP_VERSION_FOR_ITEMS);
      }
    } catch {
      // Ignore
    }

    return () => {
      overwolf.windows.onMessageReceived.removeListener(handler);
    };
  }, []);

  return { supported, gepVersion };
}
