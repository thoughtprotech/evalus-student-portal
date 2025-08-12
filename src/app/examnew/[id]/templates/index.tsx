"use client";

import React from "react";
import type { ExamTemplateProps } from "../engine/types";
import { FlexibleTemplate } from "./flexible/Template";
import { ClassicRightTemplate } from "./classic-right/Template";
import { presets } from "./presets";

export function getTemplate(key: string) {
  const normalized = (key || "").toLowerCase();

  if (normalized === "classic-right") {
    return function ClassicRight(props: ExamTemplateProps) {
      return <ClassicRightTemplate {...props} />;
    };
  }

  // Default to flexible template with preset config by key
  const preset = presets[key as keyof typeof presets] ?? presets.Default;
  return function TemplateWithPreset(props: ExamTemplateProps) {
    return <FlexibleTemplate {...props} preset={preset} />;
  };
}
