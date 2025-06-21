import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  GalleryVerticalEnd,
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
  // Simple check to see if this is a PDF
  const isPdf = url.trim().toLowerCase().endsWith(".pdf");

  if (isPdf && !forceDownload) {
    // PDFs can be safely viewed in-browser:
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
  if (type.includes("pdf")) {
    return <FileText size={25} className="text-red-500" />;
  } else if (type.includes("excel")) {
    return <FileSpreadsheet size={25} className="text-green-500" />;
  } else if (type.includes("word")) {
    return <FileText size={25} className="text-blue-500" />;
  } else if (type.includes("powerpoint")) {
    return <GalleryVerticalEnd size={25} className="text-orange-500" />;
  } else {
    return <FileText size={25} className="text-gray-500" />;
  }
};

// Recursive Tree Node component
const TreeNode: React.FC<{ node: FileNode; level?: number }> = ({
  node,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.type === "folder" && node.children?.length;

  const toggle = (node: FileNode) => {
    if (hasChildren) {
      setIsOpen((open) => !open);
    } else {
      openOrDownloadDocument(node.url!);
    }
  };

  return (
    <div>
      <div
        onClick={() => toggle(node)}
        className={`
          flex items-center gap-3 cursor-pointer p-2 rounded-md
          transition-colors duration-150
          ${hasChildren ? "hover:bg-gray-100" : "hover:bg-gray-100"}
          ${level > 0 ? "ml-2" : ""}
        `}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren &&
          (isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />)}

        {/* Folder or File Icon */}
        {node.type === "folder" ? (
          isOpen ? (
            <FolderOpen size={25} className="text-gray-500" />
          ) : (
            <Folder size={25} className="text-gray-500" />
          )
        ) : (
          getFileTypeIcon(node.fileType || "")
        )}

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
