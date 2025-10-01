import React, { useState, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Badge, ChevronUp } from "lucide-react";
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

  // Recursive node renderer so nested children (grandchildren and beyond) are shown
  const renderNode = (node: CandidateGroup, level: number) => {
    const kids = tree[node.candidateGroupId] || [];
    const hasChildren = kids.length > 0;
    const isOpen = !!expanded[node.candidateGroupId];

    return (
      <div key={node.candidateGroupId} className="w-full">
        <div
          className={`flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer transition-colors`}
          style={{ marginLeft: `${Math.min(level, 3) * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggle(node.candidateGroupId);
            } else {
              // Set the group context without navigating away from current page
              setCurrentGroupId(node.candidateGroupId.toString());
              setGroupSelected(true);
              // Only navigate if we're not already on the dashboard
              if (window.location.pathname !== "/dashboard") {
                router.push("/dashboard");
              }
            }
          }}
        >
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <Badge size={14} />
            )}
            <span className="text-sm text-gray-800">
              {node.candidateGroupName}
            </span>
          </div>
        </div>
        {hasChildren && isOpen && (
          <div className="space-y-1">
            {kids.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
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
          {roots.map((root) => renderNode(root, 0))}
        </div>
      )}
    </nav>
  );
};
