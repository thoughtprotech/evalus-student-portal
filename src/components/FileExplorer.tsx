import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  GalleryVerticalEnd,
  Eye,
} from "lucide-react";

// Data structure for file system nodes
export interface FileNode {
  name: string;
  type: "file" | "folder";
  fileType?: string;
  fileSize?: string;
  uploadDate?: string;
  description?: string;
  children?: FileNode[];
  url?: string;
}

interface FileExplorerProps {
  data: FileNode[];
}

export function openOrDownloadDocument(
  url: string,
  forceDownload: boolean = false
): void {
  if (!url || url.trim() === "") {
    return; // No action when URL missing
  }
  const lower = url.trim().toLowerCase();
  // If it's a YouTube link or MP4, open in new tab for playback
  if (/youtube\.com\/watch|youtu\.be\//i.test(url) || lower.endsWith('.mp4')) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  // Otherwise create a hidden anchor with `download` to force saving.
  const link = document.createElement("a");
  link.href = url;
  // The download attribute suggests a filename; browsers may ignore it cross-origin.
  link.download = url.split("/").pop() || "";
  // Append, click, and remove to kick off download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const getFileTypeIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  // Use smaller icons and ensure they don't stretch layout; container enforces width
  if (type.includes('youtube')) return <GalleryVerticalEnd size={18} className="text-purple-500" />;
  if (type.includes('mp4')) return <GalleryVerticalEnd size={18} className="text-indigo-600" />;
  if (type.includes("pdf")) {
    return <FileText size={18} className="text-red-500" />;
  } else if (type.includes("excel")) {
    return <FileSpreadsheet size={18} className="text-green-500" />;
  } else if (type.includes("word")) {
    return <FileText size={18} className="text-blue-500" />;
  } else if (type.includes("powerpoint")) {
    return <GalleryVerticalEnd size={18} className="text-orange-500" />;
  } else {
    return <FileText size={18} className="text-gray-500" />;
  }
};

// Recursive Tree Node component
const TreeNode: React.FC<{ node: FileNode; level?: number }> = ({
  node,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.type === "folder" && node.children?.length;
  const isFileWithoutUrl = node.type === "file" && (!node.url || node.url.trim() === "");
  const isVideoType = node.type === 'file' && (node.fileType?.toLowerCase().includes('mp4') || node.fileType?.toLowerCase().includes('youtube'));

  const toggle = (node: FileNode) => {
    if (hasChildren) {
      setIsOpen((open) => !open);
    } else if (isVideoType) {
      // For video types, toggle inline player
      setIsOpen((open) => !open);
    } else if (!isFileWithoutUrl) {
      openOrDownloadDocument(node.url!);
    }
  };

  return (
    <div>
      <div
        onClick={() => toggle(node)}
        title={isFileWithoutUrl ? "No Document URL" : node.name}
        className={`
          flex items-center gap-3 p-2 rounded-md
          transition-colors duration-150
          ${hasChildren || !isFileWithoutUrl ? "cursor-pointer hover:bg-gray-100" : "cursor-not-allowed bg-gray-50"}
          ${level > 0 ? "ml-2" : ""}
          ${isFileWithoutUrl ? "opacity-60" : ""}
        `}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren &&
          (isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />)}

        {/* Folder or File Icon (fixed width) */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {node.type === "folder" ? (
            isOpen ? (
              <FolderOpen size={18} className="text-gray-500" />
            ) : (
              <Folder size={18} className="text-gray-500" />
            )
          ) : (
            getFileTypeIcon(node.fileType || "")
          )}
        </div>

        {/* Name */}
        <div className="w-full flex flex-col">
          <div className="flex flex-col md:flex md:flex-row md:gap-2">
            <h1 className="max-w-64 md:max-w-full select-none truncate font-medium text-gray-800">
              {node.name}
            </h1>
            {node.type === "file" && (
              <div className="flex items-center gap-2">
                <h1
                  className={`w-fit select-none truncate font-bold text-white text-xs ${
                    node.fileType!.toLowerCase().includes("pdf")
                      ? "bg-red-500"
                      : node.fileType!.toLowerCase().includes("excel")
                      ? "bg-green-700"
                      : node.fileType!.toLowerCase().includes("word")
                      ? "bg-blue-500"
                      : node.fileType!.toLowerCase().includes("powerpoint")
                      ? "bg-orange-500"
                      : "bg-gray-500"
                  } px-1 rounded-sm`}
                >
                  {node.fileType}
                </h1>
                <h1 className="select-none truncate font-medium text-gray-600 text-sm">
                  {node.fileSize}
                </h1>
                <h1 className="select-none truncate font-medium text-gray-600 text-sm">
                  {node.uploadDate}
                </h1>
                {isFileWithoutUrl && (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-1 rounded-sm">
                    No URL
                  </span>
                )}
                {/* For video types, show a compact View button */}
                {(node.fileType || '').toLowerCase().includes('mp4') || (node.fileType || '').toLowerCase().includes('youtube') ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(open => !open); }}
                    title="View"
                    className="ml-2 p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    aria-label={`View ${node.name}`}
                  >
                    <Eye size={16} />
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <h1 className="select-none max-w-3/4 truncate font-medium text-gray-600 text-sm">
            {node.description}
          </h1>
        </div>
      </div>

      {/* Children Container with nesting line */}
      {hasChildren && isOpen && (
        <div className={`border-l-2 border-gray-200 ml-2 pl-4 mt-1`}>
          {node.children!.map((child) => (
            <TreeNode key={child.name} node={child} level={level + 1} />
          ))}
        </div>
      )}

      {/* Inline player for video file types */}
      {(!hasChildren && isVideoType && isOpen) && (
        <div className="mt-2 ml-6">
          {node.fileType!.toLowerCase().includes('youtube') ? (
            <iframe className="w-full h-64" src={node.url?.replace("watch?v=", "embed/") || ''} title={node.name} frameBorder={0} allowFullScreen />
          ) : (
            <video className="w-full h-64" controls>
              <source src={node.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  );
};

// Main Explorer component
const FileExplorer: React.FC<FileExplorerProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white overflow-auto">
      <div className="w-full rounded-lg">
        {data.map((node) => (
          <TreeNode key={node.name} node={node} />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;

// Usage Example:
// const fsData: FileNode[] = [
//   { name: 'src', type: 'folder', children: [
//     { name: 'components', type: 'folder', children: [
//       { name: 'Button.tsx', type: 'file' }, { name: 'Modal.tsx', type: 'file' }
//     ]},
//     { name: 'App.tsx', type: 'file' },
//   ]},
//   { name: 'package.json', type: 'file' },
// ];
// <FileExplorer data={fsData} />;
