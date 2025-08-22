import React, { useState, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Tag, Badge, ChevronUp } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";

interface CandidateGroup {
  candidateGroupId: number;
  candidateGroupName: string;
  parentId: number;
  relation: "PARENT" | "SELF" | string;
  level: number;
}

interface SideBarFileTreeProps {
  data: CandidateGroup[];
  rootLabel: string;
  rootLink: string;
  regExp: string;
  rootIcon?: ReactNode;
  initiallyExpanded?: boolean;
  pathname: string;
  /** Max height for the expandable list area (defaults to 50% viewport height) */
  maxListHeight?: string;
}

// Build map from parentId to children (defensive against non-array)
const buildTree = (data: CandidateGroup[] | undefined | null) => {
  const map: Record<number, CandidateGroup[]> = {};
  const arr: CandidateGroup[] = Array.isArray(data) ? data : [];
  arr.forEach((item) => {
    map[item.parentId] = map[item.parentId] || [];
    map[item.parentId].push(item);
  });
  return map;
};

export const SideBarFileTree: React.FC<SideBarFileTreeProps> = ({
  data,
  rootLabel,
  rootIcon,
  rootLink,
  regExp,
  initiallyExpanded = true,
  pathname,
  maxListHeight = "50vh",
}) => {
  const tree = buildTree(data);
  const [rootExpanded, setRootExpanded] = useState(initiallyExpanded);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { setCurrentGroupId, setGroupSelected } = useUser();

  const router = useRouter();

  const toggleRoot = () => {
    setRootExpanded((prev) => !prev);
  };

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Render children of a parent. Original code filtered by relation === 'SELF',
  // but current API response supplies empty relation strings, so nothing rendered.
  // Fallback: treat any item whose parentId matches as a child unless it is also a top-level root.
  const renderChildren = (parentId: number) => {
    const children = tree[parentId] || [];
    return children
      .filter((c) => c.parentId === parentId) // defensive
      .map((child) => (
        <div
          key={child.candidateGroupId}
          className="flex items-center ml-4 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          onClick={() => {
            router.push("/dashboard");
            setCurrentGroupId(child.candidateGroupId.toString());
            setGroupSelected(true);
          }}
        >
          <Badge size={14} />
          <h1 className="ml-2 flex items-center space-x-1 text-sm text-gray-700">
            <span>{child.candidateGroupName}</span>
          </h1>
        </div>
      ));
  };

  // Top-level parents
  const safeData = Array.isArray(data) ? data : [];
  const roots = safeData.filter(
    (item) => item.parentId === 0 || item.relation === "PARENT"
  );

  return (
    <nav className="space-y- w-full">
      {/* Root toggler */}
      <div
        className={`w-full flex items-center space-x-3 p-2 font-semibold transition-all rounded-lg ${new RegExp(regExp).test(pathname)
            ? "text-indigo-600"
            : "text-gray-600"
          } hover:bg-indigo-100 hover:text-indigo-600`}
        onClick={toggleRoot}
      >
        <div className="w-full flex justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            {rootIcon && <span>{rootIcon}</span>}
            <Link
              href={rootLink}
              className="font-semibold"
              onClick={(e) => {
                // Ensure clicking TestHub (root) resets group selection so StudentDashboard endpoint is used
                // Prevent this click from only toggling expansion when user intends to navigate
                setGroupSelected(false);
              }}
            >
              {rootLabel}
            </Link>
          </div>
          {rootExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {rootExpanded && (
        <div
          className={`space-y-1 overflow-y-auto pr-1 ${maxListHeight ? `max-h-[${maxListHeight}]` : 'max-h-[50vh]'}`}
        >
          {roots.map((root) => {
            const children = tree[root.candidateGroupId] || [];
            // Consider children existing if any node lists this root as its parent
            const hasChildren = children.length > 0;
            const isOpen = !!expanded[root.candidateGroupId];
            return (
              <div key={root.candidateGroupId}>
                <div
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                  onClick={() => hasChildren && toggle(root.candidateGroupId)}
                >
                  <div className="flex items-center space-x-2">
                    {hasChildren ? (
                      isOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )
                    ) : (
                      <Tag size={14} />
                    )}
                    <span className="text-sm font-medium text-gray-800">
                      {root.candidateGroupName}
                    </span>
                  </div>
                </div>
                {hasChildren && isOpen && renderChildren(root.candidateGroupId)}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
};
