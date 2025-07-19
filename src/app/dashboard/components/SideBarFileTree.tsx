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
}

// Build map from parentId to children
const buildTree = (data: CandidateGroup[]) => {
  const map: Record<number, CandidateGroup[]> = {};
  data.forEach((item) => {
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
}) => {
  const tree = buildTree(data);
  const [rootExpanded, setRootExpanded] = useState(initiallyExpanded);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { setCurrentGroupId } = useUser();

  const router = useRouter();

  const toggleRoot = () => {
    setRootExpanded((prev) => !prev);
  };

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderChildren = (parentId: number) => {
    return tree[parentId]
      ?.filter((c) => c.relation === "SELF")
      .map((child) => (
        <div
          key={child.candidateGroupId}
          className="flex items-center ml-8 py-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          onClick={() => {
            router.push("/dashboard");
            setCurrentGroupId(child.candidateGroupId.toString());
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
  const roots = data.filter(
    (item) => item.parentId === 0 || item.relation === "PARENT"
  );

  return (
    <nav className="space-y-2 w-full">
      {/* Root toggler */}
      <div
        className={`w-full flex items-center space-x-3 px-2 py-3 font-semibold transition-all rounded-lg ${
          new RegExp(regExp).test(pathname)
            ? "text-indigo-600"
            : "text-gray-600"
        } hover:bg-indigo-100 hover:text-indigo-600`}
        onClick={toggleRoot}
      >
        <div className="w-full flex justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            {rootIcon && <span>{rootIcon}</span>}
            <Link href={rootLink} className="font-semibold">
              {rootLabel}
            </Link>
          </div>
          {rootExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {rootExpanded && (
        <div className="space-y-1">
          {roots.map((root) => {
            const children = tree[root.candidateGroupId] || [];
            const hasChildren = children.some((c) => c.relation === "SELF");
            const isOpen = !!expanded[root.candidateGroupId];
            return (
              <div key={root.candidateGroupId}>
                <div
                  className="flex items-center justify-between px-4 py-1 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
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
                    <span className="font-medium text-gray-800">
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
