"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import FileExplorer, { FileNode } from "@/components/FileExplorer";
import { fetchDocumentsTreeAction } from "@/app/actions/dashboard/documentsTree";
import { PublishedDocumentTreeItem } from "@/utils/api/types";
import formatToDDMMYYYY_HHMM from "@/utils/formatIsoTime";

export default function Index() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [referenceList, setReferenceList] = useState<FileNode[]>([]);

  const fetchReferencesList = async () => {
    const { data, status } = await fetchDocumentsTreeAction();
    if (status === 200 && Array.isArray(data)) {
      const tree = buildFileTreeFromDocuments(data);
      setReferenceList(tree);
    }
    setLoaded(true);
  };

  useEffect(() => {
    fetchReferencesList();
  }, []);

  function buildFileTreeFromDocuments(items: PublishedDocumentTreeItem[]): FileNode[] {
    // Group by folder path first
    // Each item currently seems level 0 with path === folder name; prepare for future nested paths like "Parent/Child"
    interface FolderMapEntry { children: Map<string, FolderMapEntry>; files: PublishedDocumentTreeItem[]; }
    const root: FolderMapEntry = { children: new Map(), files: [] };

    const ensureFolder = (segments: string[]): FolderMapEntry => {
      let current = root;
      for (const seg of segments) {
        if (!current.children.has(seg)) {
          current.children.set(seg, { children: new Map(), files: [] });
        }
        current = current.children.get(seg)!;
      }
      return current;
    };

    items.forEach(item => {
      // Support both "/", ">", and "\" separated paths from backend (trim spaces)
      const raw = item.path && item.path.trim().length > 0 ? item.path : (item.publishedDocumentFolderName || "");
      let pathSegments = raw
        .split(/[>/\\]/g)
        .map(s => s.trim())
        .filter(Boolean);

      // Some payloads include the document name as the last path segment; strip if it looks like a file
      const last = pathSegments[pathSegments.length - 1]?.toLowerCase();
      const docNameLower = (item.documentName || "").toLowerCase();
      if (last && (last === docNameLower || /\.(pdf|docx?|xlsx?|pptx?)$/i.test(last))) {
        pathSegments = pathSegments.slice(0, -1);
      }

      // If backend path is truncated (e.g., only parent folder), ensure the leaf folder
      const leafFolder = (item.publishedDocumentFolderName || '').trim();
      const lastSeg = pathSegments[pathSegments.length - 1];
      if (leafFolder && (!lastSeg || leafFolder.toLowerCase() !== lastSeg.toLowerCase())) {
        pathSegments.push(leafFolder);
      }

      const folderNode = ensureFolder(pathSegments);
      folderNode.files.push(item);
    });

    const toFileNodes = (entry: FolderMapEntry, name?: string): FileNode[] => {
      const folderChildren: FileNode[] = [];
      // First add files (sorted by name) so they appear directly under the folder header
      const sortedFiles = entry.files
        .slice()
        .sort((a, b) => (a.documentName || '').localeCompare(b.documentName || ''));
      for (const file of sortedFiles) {
        folderChildren.push({
          name: file.documentName,
          type: 'file',
          fileType: inferFileType(file.documentUrl || file.documentName),
          fileSize: '',
          uploadDate: `${formatToDDMMYYYY_HHMM(file.validFrom)} - ${formatToDDMMYYYY_HHMM(file.validTo)}`,
          description: file.publishedDocumentFolderName,
          url: buildDocumentUrl(file.documentUrl),
        });
      }
      // Then add subfolders (sorted alphabetically) below the files for a consistent UI
      const sortedChildren = Array.from(entry.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      for (const [childName, childEntry] of sortedChildren) {
        folderChildren.push({
          name: childName,
          type: 'folder',
          children: toFileNodes(childEntry, childName),
        });
      }
      return folderChildren;
    };

    // Top-level folders become root nodes
    const result: FileNode[] = [];
    const topSorted = Array.from(root.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [folderName, entry] of topSorted) {
      result.push({
        name: folderName,
        type: 'folder',
        children: toFileNodes(entry, folderName),
      });
    }

    // Also include any root-level files (no folder path) alongside top-level folders
    if (root.files.length > 0) {
      const sortedRootFiles = root.files
        .slice()
        .sort((a, b) => (a.documentName || '').localeCompare(b.documentName || ''));
      for (const file of sortedRootFiles) {
        result.push({
          name: file.documentName,
          type: 'file',
          fileType: inferFileType(file.documentUrl || file.documentName),
          fileSize: '',
          uploadDate: `${formatToDDMMYYYY_HHMM(file.validFrom)} - ${formatToDDMMYYYY_HHMM(file.validTo)}`,
          description: file.publishedDocumentFolderName,
          url: buildDocumentUrl(file.documentUrl),
        });
      }
    }
    return result;
  }

  function inferFileType(urlOrName: string): string {
    const lower = urlOrName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'Excel';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'Word';
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PowerPoint';
    return 'File';
  }

  function buildDocumentUrl(docUrl: string | null): string {
    if (!docUrl) return '';
    // If already absolute
    if (/^https?:\/\//i.test(docUrl)) return docUrl;
    // If backend returns relative path, prefix API base URL (env variable) if available
    // We access via NEXT_PUBLIC like pattern; fallback to window location origin
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}${docUrl.startsWith('/') ? docUrl : '/' + docUrl}`;
  }

  function filterFileNodes(nodes: FileNode[], query: string): FileNode[] {
    const q = query.toLowerCase();

    return nodes.reduce<FileNode[]>((acc, node) => {
      const nameMatches = node.name.toLowerCase().includes(q);
      const children = node.children
        ? filterFileNodes(node.children, query)
        : undefined;

      // Keep this node if its name matches, or if any child matches
      if (nameMatches || (children && children.length > 0)) {
        acc.push({
          ...node,
          // only include children if there are any left after filtering
          children: children && children.length > 0 ? children : undefined,
        });
      }
      return acc;
    }, []);
  }

  // usage in your component
  const filteredReferenceList = filterFileNodes(referenceList, searchQuery);

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="w-full flex flex-col-reverse md:flex md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:max-w-sm">
          <SearchBar
            placeholder="Search References"
            onSearch={(value) => {
              setSearchQuery(value);
            }}
          />
        </div>
      </div>
      <div className="w-full ">
        <FileExplorer data={filteredReferenceList} />
      </div>
    </div>
  );
}
