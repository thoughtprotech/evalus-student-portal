"use client";

import React from "react";
import type { ExamTemplateProps } from "../../engine/types";
import { FlexibleTemplate } from "../flexible/Template";

export function ClassicRightTemplate(props: ExamTemplateProps) {
  // Reuse FlexibleTemplate with a fixed right palette
  return (
    <FlexibleTemplate
      {...props}
      preset={{ palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "default" }}
    />
  );
}
