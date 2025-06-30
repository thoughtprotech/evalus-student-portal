"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { fetchReferencesListAction } from "@/app/actions/dashboard/referencesList";
import FileExplorer, { FileNode } from "@/components/FileExplorer";

export default function Index() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [referenceList, setReferenceList] = useState<FileNode[]>([]);

  const fetchReferencesList = async () => {
    const res = fetchReferencesListAction();
    const { data, status } = await res;
    if (status === 200) {
      setReferenceList(data!);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchReferencesList();
  }, []);

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
