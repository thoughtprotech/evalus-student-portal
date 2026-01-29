"use client";

import { act, useEffect, useMemo, useState } from "react";
import {
  Info,
  ShieldQuestion,
  Timer,
  ListChecks,
  UserRound,
} from "lucide-react";
import {
  GetTestMetaDataResponse,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import Modal from "@/components/Modal";
import OnHover from "@/components/OnHover";
import QuestionCountPreview from "../QuestionCountPreview";
import { TextOrHtml } from "@/components/TextOrHtml";
import QuestionsPreviewList from "./_components/QuestionsPreviewList";
import HeaderContainer from "./_components/HeaderContainer";
import TitleWithTimer from "./_components/TitleWithTimer";
import SectionTabs from "./_components/SectionTabs";
import ActionsBar from "./_components/ActionBar";
import InstructionsModal from "./_components/InstructionsModal";
import QuestionsPreviewModal from "./_components/QuestionPreviewModal";
import { formatDuration } from "@/utils/formatIsoTime";
import TimerChip from "./_components/TimerChip";
import { getUserAction } from "@/app/actions/getUser";
import WelcomeChip from "./_components/WelcomeChip";
import ZoomControls from "./_components/ZoomControls";

// Types
type HeaderProps = {
  data: GetTestMetaDataResponse;
  onTestTimeUp: () => void;
  onSectionTimeUp: () => void;
  durationMs?: number;
  onSelectSection?: (section: SectionsMetaDataInterface) => void;
  currentSectionId: SectionsMetaDataInterface;
  setCurrentSection: any;
  currentSection: SectionsMetaDataInterface;
  // sectionMaxTime removed (deprecated per-section timing)
};

// Root Component
export default function Header({
  data,
  onTestTimeUp,
  onSectionTimeUp,
  onSelectSection,
  currentSectionId,
  setCurrentSection,
  currentSection,
}: // sectionMaxTime
HeaderProps) {
  const { testMeta, sections } = data;
  const { testName, instruction } = testMeta;
  const [userName, setUserName] = useState<string>("");

  const fetchUserName = async () => {
    const user = await getUserAction();
    setUserName(user || "");
  };

  useEffect(() => {
    fetchUserName();
  }, []);

  return (
    <HeaderContainer>
      <div className="w-full flex flex-col justify-between relative">
        <div className="w-full flex justify-between">
          <div>
            <h1 className="text-sm font-medium">Section</h1>
          </div>
          <div>
            <TimerChip
              title="Time Left:"
              durationMs={currentSectionId?.sectionMaxTimeDuration! * 60 * 1000}
              onComplete={onSectionTimeUp}
            />
          </div>
        </div>
        <SectionTabs
          sections={sections}
          activeSectionId={currentSectionId?.sectionId!}
          onSelectSection={onSelectSection}
        />
      </div>
    </HeaderContainer>
  );
}
