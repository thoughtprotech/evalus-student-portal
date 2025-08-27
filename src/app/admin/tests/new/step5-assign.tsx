"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useTestDraft } from "@/contexts/TestDraftContext";
import ImportantInstructions from "@/components/ImportantInstructions";

type Props = {
  registerValidator?: (fn: () => boolean) => void;
};

type GroupNode = {
  CandidateGroupId: number;
  GroupName: string;
  children?: GroupNode[];
};

export default function Step5Assign({ registerValidator }: Props) {
  const { draft, setDraft } = useTestDraft();
  const [groupTree, setGroupTree] = useState<GroupNode[]>([]);
  const [checkedGroups, setCheckedGroups] = useState<Record<number, boolean>>({});
  const [products, setProducts] = useState<{ ProductId: number; ProductName: string }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const groupsRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const groupsBtnRef = useRef<HTMLButtonElement | null>(null);
  const productsBtnRef = useRef<HTMLButtonElement | null>(null);
  const [groupsPlaceUp, setGroupsPlaceUp] = useState(false);
  const [productsPlaceUp, setProductsPlaceUp] = useState(false);
  const hydratedRef = useRef(false);
  const combosSigRef = useRef<string>("");
  const validateRef = useRef<() => boolean>(() => true);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [groupRes, prodRes] = await Promise.all([
          apiHandler(endpoints.getCandidateGroupTreeOData, null as any),
          apiHandler(endpoints.getActiveTestProductsOData, null as any),
        ]);
        if (!mounted) return;
        const gdataAny: any = (groupRes as any)?.data;
        const raw = Array.isArray(gdataAny?.value)
          ? (gdataAny.value as any[])
          : Array.isArray(gdataAny)
          ? (gdataAny as any[])
          : [];
        const pickChildren = (n: any): any[] => {
          const candidates = [
            n?.children,
            n?.Children,
            n?.childrens,
            n?.ChildNodes,
            n?.Items,
            n?.Nodes,
            n?.Groups,
            n?.Subgroups,
          ];
          for (const c of candidates) if (Array.isArray(c)) return c;
          return [];
        };
  const norm = (nodes: any[]): GroupNode[] =>
          (nodes || [])
            .map((n) => {
              const id = Number(
    n?.CandidateGroupId ??
    n?.candidateGroupId ??
    n?.CandidateGroupID ??
    n?.GroupId ??
    n?.GroupID ??
    n?.Id ??
    n?.id
              );
              const name =
                n?.GroupName ??
                n?.CandidateGroupName ??
    n?.name ??
                n?.Group ??
                n?.Name ??
                n?.Title ??
                n?.Label ??
                (Number.isFinite(id) ? `Group ${id}` : "Group");
              const kids = pickChildren(n);
              if (!Number.isFinite(id)) return null;
              return { CandidateGroupId: id, GroupName: String(name), children: norm(kids) } as GroupNode;
            })
            .filter(Boolean) as GroupNode[];

        const gdata: GroupNode[] = norm(raw);
        const pdata = ((prodRes?.data?.value ?? []) as any[]).map((p) => ({ ProductId: p.ProductId, ProductName: p.ProductName }));
        setGroupTree(Array.isArray(gdata) ? gdata : []);
        setProducts(pdata);
      } catch {
        if (mounted) {
          setGroupTree([]);
          setProducts([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hydrate UI state from draft.TestAssignments so selections persist when returning to Step 5
  useEffect(() => {
    try {
      const assignments: any[] = Array.isArray((draft as any)?.TestAssignments)
        ? (draft as any).TestAssignments
        : [];
      if (assignments.length > 0) {
        const pids = Array.from(
          new Set(
            assignments
              .map((a: any) => Number(a?.ProductId))
              .filter((n: any) => Number.isFinite(n))
          )
        );
        const gids = Array.from(
          new Set(
            assignments
              .map((a: any) => Number(a?.CandidateGroupId))
              .filter((n: any) => Number.isFinite(n))
          )
        );
        // Only update if changed
        const arrEqAsSet = (a: number[], b: number[]) => {
          if (a.length !== b.length) return false;
          const sa = new Set(a);
          for (const v of b) if (!sa.has(v)) return false;
          return true;
        };
        if (!arrEqAsSet(pids, selectedProductIds)) {
          setSelectedProductIds(pids);
        }
        const currentGids = Object.keys(checkedGroups)
          .filter((k) => checkedGroups[Number(k)])
          .map((k) => Number(k));
        if (!arrEqAsSet(gids, currentGids)) {
          const next: Record<number, boolean> = {};
          gids.forEach((id) => (next[id] = true));
          setCheckedGroups(next);
        }
      }
    } finally {
      hydratedRef.current = true;
    }
  }, [draft]);

  // Helpers: walk tree
  const collectDescendantIds = (node: GroupNode): number[] => {
    const out: number[] = [node.CandidateGroupId];
    (node.children ?? []).forEach((c) => out.push(...collectDescendantIds(c)));
    return out;
  };

  const getGroupLabel = (n: GroupNode): string => {
    return (
      (n as any).GroupName ??
      (n as any).CandidateGroupName ??
      (n as any).Group ??
      (n as any).Name ??
      `Group ${n.CandidateGroupId}`
    );
  };

  // Toggle a group: select/deselect node and all descendants
  const toggleGroup = (node: GroupNode, value: boolean) => {
    const ids = collectDescendantIds(node);
    setCheckedGroups((prev) => {
      const next = { ...prev } as Record<number, boolean>;
      ids.forEach((id) => (next[id] = value));
      return next;
    });
  };

  // Render group tree with checkboxes (flat, indented rows inside dropdown)
  const renderTree = (nodes: GroupNode[], depth = 0) => (
    <ul>
      {nodes.map((n) => (
        <li key={n.CandidateGroupId}>
          <div className="px-3 py-1 hover:bg-gray-50">
            <label className="flex items-center gap-2" style={{ paddingLeft: depth * 12 }}>
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={!!checkedGroups[n.CandidateGroupId]}
                onChange={(e) => toggleGroup(n, e.target.checked)}
              />
              <span className="text-sm text-gray-800 truncate">{getGroupLabel(n)}</span>
            </label>
          </div>
          {n.children && n.children.length > 0 && renderTree(n.children, depth + 1)}
        </li>
      ))}
    </ul>
  );

  // Persist into draft.TestAssignments whenever selection changes
  useEffect(() => {
    if (!hydratedRef.current) return; // avoid clearing draft before initial hydration
    const groupIds = Object.keys(checkedGroups)
      .filter((k) => checkedGroups[Number(k)])
      .map(Number);
    // Compute signature for dedup
    let sig = "";
    if (groupIds.length > 0 && selectedProductIds.length > 0) {
      const pairs: string[] = [];
      for (const pid of selectedProductIds) {
        for (const gid of groupIds) pairs.push(`${pid}:${gid}`);
      }
      pairs.sort();
      sig = pairs.join(",");
    }
    if (sig === combosSigRef.current) return; // no change
    combosSigRef.current = sig;
    if (sig === "") {
      // Clear if empty, but only if not already empty
      setDraft((d: any) => {
        const existing: any[] = Array.isArray((d as any)?.TestAssignments)
          ? (d as any).TestAssignments
          : [];
        if (existing.length === 0) return d;
        return { ...d, TestAssignments: [] };
      });
      return;
    }
    // Build combos array once
    const combos = sig.split(",").map((p) => {
      const [pid, gid] = p.split(":");
      return { ProductId: Number(pid), CandidateGroupId: Number(gid) };
    });
    setDraft((d: any) => {
      const existing: any[] = Array.isArray((d as any)?.TestAssignments)
        ? (d as any).TestAssignments
        : [];
      const existingSig = existing
        .map((a) => `${Number(a.ProductId)}:${Number(a.CandidateGroupId)}`)
        .sort()
        .join(",");
      if (existingSig === sig) return d;
      return { ...d, TestAssignments: combos };
    });
  }, [checkedGroups, selectedProductIds, setDraft]);

  // Validation: If any candidate group is selected, at least one product must be selected.
  const validate = () => {
    const hasGroup = Object.values(checkedGroups).some(Boolean);
    if (hasGroup && selectedProductIds.length === 0) {
      setError("Select at least one product for the chosen candidate groups.");
      return false;
    }
    setError(null);
    return true;
  };

  // Keep latest validate in ref and register once
  useEffect(() => {
    validateRef.current = () => validate();
  }, [checkedGroups, selectedProductIds]);

  useEffect(() => {
    if (registerValidator) {
      registerValidator(() => validateRef.current());
    }
  }, [registerValidator]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (groupsOpen && groupsRef.current && !groupsRef.current.contains(t)) setGroupsOpen(false);
      if (productsOpen && productsRef.current && !productsRef.current.contains(t)) setProductsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [groupsOpen, productsOpen]);

  // Summaries for buttons
  const selectedGroupCount = useMemo(() => Object.values(checkedGroups).filter(Boolean).length, [checkedGroups]);
  const selectedProductCount = selectedProductIds.length;
  // Perf: memoized helpers for products
  const productNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of products) m.set(p.ProductId, p.ProductName);
    return m;
  }, [products]);
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate Groups dropdown */}
          <div ref={groupsRef} className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">Candidate Groups</label>
            <button
              type="button"
              ref={groupsBtnRef}
              className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              onClick={() => {
                const rect = groupsBtnRef.current?.getBoundingClientRect();
                const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
                setGroupsPlaceUp(spaceBelow < 320); // flip if near the footer
                setGroupsOpen((v) => !v);
              }}
            >
              <span className="truncate">
                {selectedGroupCount === 0 ? (
                  <span className="text-gray-500">Select candidate groups</span>
                ) : (
                  `${selectedGroupCount} selected`
                )}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {groupsOpen && (
              <div className={`absolute left-0 right-0 ${groupsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}> 
                {groupTree.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No groups found.</div>
                ) : (
                  renderTree(groupTree)
                )}
              </div>
            )}
          </div>

          {/* Products dropdown */}
          <div ref={productsRef} className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">Products</label>
            <button
              type="button"
              ref={productsBtnRef}
              className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              onClick={() => {
                const rect = productsBtnRef.current?.getBoundingClientRect();
                const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
                setProductsPlaceUp(spaceBelow < 320);
                setProductsOpen((v) => !v);
              }}
            >
              <span className="truncate">
                {selectedProductCount === 0 ? (
                  <span className="text-gray-500">Select products</span>
                ) : selectedProductCount <= 2 ? (
                  selectedProductIds.map((id) => productNameById.get(id) ?? String(id)).join(", ")
                ) : (
                  `${selectedProductCount} selected`
                )}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {productsOpen && (
              <div className={`absolute left-0 right-0 ${productsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}>
                {products.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No active products found.</div>
                ) : (
                  <ul className="py-1">
                    {products.map((p) => (
                      <li key={p.ProductId} className="px-3 py-1 hover:bg-gray-50">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedProductIdSet.has(p.ProductId)}
                            onChange={(e) => {
                              setSelectedProductIds((prev) =>
                                e.target.checked
                                  ? Array.from(new Set([...prev, p.ProductId]))
                                  : prev.filter((id) => id !== p.ProductId)
                              );
                            }}
                          />
                          <span className="truncate">{p.ProductName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div>
        <ImportantInstructions
          title="Assignment"
          detail="Pick candidate groups and products to create combinations. If you choose groups, selecting at least one product is required."
        />
      </div>
    </div>
  );
}
