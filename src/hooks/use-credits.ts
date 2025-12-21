import { useState, useCallback } from "react";
import { demoUserCredits, UserCredits } from "@/lib/demo-data";

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits>(demoUserCredits);

  const consumeCharacterCredits = useCallback((amount: number) => {
    setCredits((prev) => ({
      ...prev,
      characterCredits: Math.max(0, prev.characterCredits - amount),
    }));
    return true;
  }, []);

  const consumeBookCredits = useCallback((amount: number) => {
    setCredits((prev) => ({
      ...prev,
      bookCredits: Math.max(0, prev.bookCredits - amount),
    }));
    return true;
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
    consumeCharacterCredits,
    consumeBookCredits,
    hasCharacterCredits,
    hasBookCredits,
  };
}
