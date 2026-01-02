import { useState, useCallback, useEffect } from "react";
import { getBalances, CreditBalances } from "@/lib/storage/creditsStore";

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalances>(getBalances);

  // Sync with localStorage on mount and when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCredits(getBalances());
    };

    // Listen for storage events (cross-tab sync)
    window.addEventListener("storage", handleStorageChange);

    // Also poll periodically to catch same-tab updates
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Force refresh function
  const refresh = useCallback(() => {
    setCredits(getBalances());
  }, []);

  const hasCharacterCredits = useCallback(
    (amount: number) => credits.characterCredits >= amount,
    [credits.characterCredits]
  );

  const hasBookCredits = useCallback(
    (amount: number) => credits.bookCredits >= amount,
    [credits.bookCredits]
  );

  return {
    credits,
    refresh,
    hasCharacterCredits,
    hasBookCredits,
  };
}
