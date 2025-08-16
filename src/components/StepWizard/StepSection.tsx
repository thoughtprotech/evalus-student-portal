"use client";

import React, { ReactNode } from "react";

export default function StepSection({ children }: { children: ReactNode }) {
  return (
  <div className="p-4 sm:p-6">
      {children}
    </div>
  );
}
