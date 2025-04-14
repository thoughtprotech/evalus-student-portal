"use client";

import React, { FC } from "react";
import {
  File,
  FileText,
  Download,
  FileSpreadsheet,
  GalleryVerticalEnd,
} from "lucide-react";

interface DocumentCardProps {
  title: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  description?: string;
  downloadUrl?: string;
}

const getFileTypeIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes("pdf")) {
    return <FileText className="w-8 h-8 text-red-500" />;
  } else if (type.includes("excel")) {
    return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
  } else if (type.includes("word")) {
    return <FileText className="w-8 h-8 text-blue-500" />;
  } else if (type.includes("powerpoint")) {
    return <GalleryVerticalEnd className="w-8 h-8 text-orange-500" />;
  } else {
    return <FileText className="w-8 h-8 text-gray-500" />;
  }
};

const DocumentCard: FC<DocumentCardProps> = ({
  title,
  fileType,
  fileSize,
  uploadDate,
  description,
  downloadUrl,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden p-6 flex flex-col gap-4 justify-between">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start space-x-4 border-b border-b-gray-300 pb-4">
          <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
            {getFileTypeIcon(fileType)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">Uploaded on {uploadDate}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* File Details */}
          <div className="flex items-center gap-8 text-sm text-gray-600">
            <div>
              <p className="font-semibold">File Type</p>
              <p>{fileType}</p>
            </div>
            <div>
              <p className="font-semibold">File Size</p>
              <p>{fileSize}</p>
            </div>
          </div>
          {/* Description */}
          {description && <p className="text-gray-700">{description}</p>}
        </div>
      </div>

      {/* Download Button */}
      {downloadUrl && (
        <div className="w-full">
          <a
            href={downloadUrl}
            download
            className="w-full inline-flex items-center justify-center font-bold px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
