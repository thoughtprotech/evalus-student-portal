"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useExamController } from "@/app/examnew/[id]/engine/useExamController";
import { getTemplate } from "@/app/examnew/[id]/templates";
import type { ExamTemplateProps } from "@/app/examnew/[id]/engine/types";

export default function ExamNewPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();

  const examId = useMemo(() => Number(id), [id]);
  const templateKey = search.get("tpl") ?? "Default";

  const { state, actions, settings } = useExamController({
    examId,
    settings: {
      templateKey,
      theme: "default",
      palettePosition: "right",
      showLegend: true,
      showZoom: true,
      allowLanguageSwitch: false,
    },
  });

  const Template = getTemplate(settings.templateKey);
  const props: ExamTemplateProps = { state, actions, settings };

  if (state.loading && !state.current.questionId) {
    return (
      <div className="w-full h-[80vh] grid place-items-center text-gray-500">
        Loading exam…
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="w-full h-[80vh] grid place-items-center text-red-600">
        {state.error}
      </div>
    );
  }
  return <Template {...props} />;
}
