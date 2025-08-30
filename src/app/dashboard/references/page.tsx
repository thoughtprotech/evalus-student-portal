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
      const pathSegments = (item.path || '').split('/').filter(Boolean);
      const folderNode = ensureFolder(pathSegments);
      folderNode.files.push(item);
    });

    const toFileNodes = (entry: FolderMapEntry, name?: string): FileNode[] => {
      const folderChildren: FileNode[] = [];
      // First add subfolders
      for (const [childName, childEntry] of entry.children) {
        folderChildren.push({
          name: childName,
          type: 'folder',
          children: toFileNodes(childEntry, childName),
        });
      }
      // Then add files
      for (const file of entry.files) {
        folderChildren.push({
          name: file.documentName,
          type: 'file',
          fileType: inferFileType(file.documentUrl || file.documentName),
            // Placeholder size (unknown); could be extended when backend adds size
          fileSize: '',
          uploadDate: `${formatToDDMMYYYY_HHMM(file.validFrom)} - ${formatToDDMMYYYY_HHMM(file.validTo)}`,
          description: file.publishedDocumentFolderName,
          url: buildDocumentUrl(file.documentUrl),
        });
      }
      return folderChildren;
    };

    // Top-level folders become root nodes
    const result: FileNode[] = [];
    for (const [folderName, entry] of root.children) {
      result.push({
        name: folderName,
        type: 'folder',
        children: toFileNodes(entry, folderName),
      });
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
