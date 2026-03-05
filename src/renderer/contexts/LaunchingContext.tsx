import React, { createContext, useContext, useState, useCallback } from 'react';

interface LaunchingContextType {
  isLaunching: boolean;
  currentItemId: string | null;
  launchItem: (itemId: string) => void;
  closeLaunching: () => void;
}

const LaunchingContext = createContext<LaunchingContextType | undefined>(
  undefined
);

const LAUNCH_DISPLAY_DURATION = 10000; // 10 seconds

export const LaunchingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const closeLaunching = useCallback(() => {
    setIsLaunching(false);
    setCurrentItemId(null);
  }, []);

  const launchItem = useCallback((itemId: string) => {
    setCurrentItemId(itemId);
    setIsLaunching(true);

    // Hide the overlay after a delay
    setTimeout(() => {
      setIsLaunching(false);
      setCurrentItemId(null);
    }, LAUNCH_DISPLAY_DURATION);
  }, []);

  return (
    <LaunchingContext.Provider
      value={{ isLaunching, currentItemId, launchItem, closeLaunching }}
    >
      {children}
    </LaunchingContext.Provider>
  );
};

export const useLaunching = (): LaunchingContextType => {
  const context = useContext(LaunchingContext);
  if (!context) {
    throw new Error('useLaunching must be used within a LaunchingProvider');
  }
  return context;
};
