import React from "react";

// AUTH BYPASSED for M2M evaluation — all routes public
export interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  return <>{children}</>;
};
