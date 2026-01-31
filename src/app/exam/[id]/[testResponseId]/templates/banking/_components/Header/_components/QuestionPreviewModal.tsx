import { SectionsMetaDataInterface } from "@/utils/api/types";
import QuestionsPreviewList from "./QuestionsPreviewList";
import Modal from "@/components/Modal";

export default function QuestionsPreviewModal({
  isOpen,
  onClose,
  sections,
  currentSectionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionsMetaDataInterface[];
  currentSectionId: number | null | undefined;
}) {
  return (
    <Modal
      title="Questions Preview"
      isOpen={isOpen}
      closeModal={onClose}
      className="w-full h-screen"
    >
      <QuestionsPreviewList sections={sections} currentSectionId={currentSectionId} />
    </Modal>
  );
}