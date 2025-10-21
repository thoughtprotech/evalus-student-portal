"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useTestDraft } from "@/contexts/TestDraftContext";
// Instruction panel hidden for Step 5 per requirement

type Props = {
  registerValidator?: (fn: () => boolean) => void;
};

type CandidateGroup = {
  CandidateGroupId: number;
  GroupName: string;
};

export default function Step5Assign({ registerValidator }: Props) {
  const { draft, setDraft } = useTestDraft();
  // Left dropdown lists Candidate Groups (labelled as Categories in UI)
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
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
          // Use open OData endpoint with default ParentId filter and sort by name
          apiHandler(endpoints.listCandidateGroupsODataOpen as any, { query: "?$select=CandidateGroupId,CandidateGroupName&$orderby=CandidateGroupName" } as any),
          apiHandler(endpoints.getActiveTestProductsOData, null as any),
        ]);
        if (!mounted) return;
        // Candidate Groups
        const gAny: any = (groupRes as any)?.data ?? (groupRes as any);
        const gRaw: any[] = Array.isArray(gAny?.value) ? gAny.value : Array.isArray(gAny) ? gAny : [];
        const gList: CandidateGroup[] = gRaw
          .map((n: any) => {
            const id = Number(n?.CandidateGroupId ?? n?.candidateGroupId ?? n?.Id ?? n?.id);
            const name = n?.CandidateGroupName ?? n?.candidateGroupName ?? n?.GroupName ?? n?.groupName ?? (Number.isFinite(id) ? `Group ${id}` : "Group");
            if (!Number.isFinite(id)) return null;
            return { CandidateGroupId: id, GroupName: String(name) } as CandidateGroup;
          })
          .filter(Boolean) as CandidateGroup[];
        // Sort client-side by name for stable display
        gList.sort((a, b) => a.GroupName.localeCompare(b.GroupName));
        setCandidateGroups(gList);
        // Prune selected groups that are invalid now
        setSelectedGroupIds((prev) => {
          const valid = new Set(gList.map((c) => c.CandidateGroupId));
          const next = prev.filter((id) => valid.has(id));
          return next.length === prev.length ? prev : next;
        });

        // Products
        const pDataAny: any = (prodRes as any)?.data ?? (prodRes as any);
        const pdata = ((pDataAny?.value ?? []) as any[]).map((p) => ({ ProductId: p.ProductId, ProductName: p.ProductName }));
        setProducts(pdata);
      } catch {
        if (mounted) {
          setCandidateGroups([]);
          setProducts([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hydrate UI state from draft so selections persist when returning to Step 5
  useEffect(() => {
  if (hydratedRef.current) return; // run hydration only once
    try {
      // Products from array: keep using testAssignedProducts; prefer TestProductId but accept ProductId for compatibility
      const assignedProductsArr: any[] = Array.isArray((draft as any)?.testAssignedProducts)
        ? (draft as any).testAssignedProducts
        : Array.isArray((draft as any)?.TestAssignedProducts)
        ? (draft as any).TestAssignedProducts
        : Array.isArray((draft as any)?.testassignedProducts)
        ? (draft as any).testassignedProducts
        : [];
      let pids = Array.from(new Set(
        assignedProductsArr
          .map((a: any) => Number(a?.TestProductId ?? a?.ProductId))
          .filter((n: any) => Number.isFinite(n))
      ));
      // Candidate groups from new TestAssignmentCandidateGroups (shape: { CandidateGroupId })
      const assignedGroups: any[] = Array.isArray((draft as any)?.TestAssignmentCandidateGroups)
        ? (draft as any).TestAssignmentCandidateGroups
        : Array.isArray((draft as any)?.testAssignmentCandidateGroups)
        ? (draft as any).testAssignmentCandidateGroups
        : [];
      let gids = Array.from(new Set(assignedGroups.map((a: any) => Number(a?.CandidateGroupId)).filter((n: any) => Number.isFinite(n))));

      // Back-compat hydration from old fields if new ones are empty
      if (pids.length === 0) {
        const selP: any[] = Array.isArray((draft as any)?.SelectedProductIds)
          ? (draft as any).SelectedProductIds
          : [];
        pids = Array.from(new Set(selP.map((x) => Number(x)).filter((n) => Number.isFinite(n))));
      }
      if (gids.length === 0) {
        const selG: any[] = Array.isArray((draft as any)?.SelectedCandidateGroupIds)
          ? (draft as any).SelectedCandidateGroupIds
          : [];
        gids = Array.from(new Set(selG.map((x) => Number(x)).filter((n) => Number.isFinite(n))));
      }

      // Only update UI state if changed
      const arrEqAsSet = (a: number[], b: number[]) => {
        if (a.length !== b.length) return false;
        const sa = new Set(a);
        for (const v of b) if (!sa.has(v)) return false;
        return true;
      };
      if (!arrEqAsSet(pids, selectedProductIds)) setSelectedProductIds(pids);
      if (!arrEqAsSet(gids, selectedGroupIds)) setSelectedGroupIds(gids);
    } finally {
      hydratedRef.current = true;
    }
  }, [draft]);

  // Persist into draft selections (new model arrays) whenever selection changes
  useEffect(() => {
    if (!hydratedRef.current) return; // avoid clearing draft before initial hydration
  const nextAssignedProducts = selectedProductIds.map((id) => ({ TestProductId: id }));
  const nextAssignedGroups = selectedGroupIds.map((id) => ({ CandidateGroupId: id }));

    // Build a compact signature to avoid unnecessary state writes
    const sig = `P:[${selectedProductIds.sort((a,b)=>a-b).join(',')}];G:[${selectedGroupIds.sort((a,b)=>a-b).join(',')}]`;
    if (sig === combosSigRef.current) return;

    setDraft((prev: any) => {
      const next: any = { ...(prev || {}) };
  next.testAssignedProducts = nextAssignedProducts;
  // Clean legacy PascalCase if present
  delete next.TestAssignedProducts;
      next.TestAssignmentCandidateGroups = nextAssignedGroups;
      // Clean legacy fields to avoid server confusion
      delete next.SelectedCandidateGroupIds;
      delete next.SelectedProductIds;
      delete next.TestAssignments;
      combosSigRef.current = sig;
      return next;
    });
  }, [selectedGroupIds, selectedProductIds]);

  // Validation: relaxed per requirement – Step 5 has no blocking validations
  const validate = () => {
    setError(null);
    return true;
  };

  // Keep latest validate in ref and register once
  useEffect(() => {
    validateRef.current = () => validate();
  }, [selectedGroupIds, selectedProductIds]);

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
  const selectedGroupCount = selectedGroupIds.length;
  const selectedProductCount = selectedProductIds.length;
  // Perf: memoized helpers for products
  const productNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of products) m.set(p.ProductId, p.ProductName);
    return m;
  }, [products]);
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  // Prune any selected products that no longer exist in the products list
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;
    setSelectedProductIds((prev) => {
      const validIds = new Set(products.map((p) => p.ProductId));
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [products]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
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
                  <span className="text-gray-500">Select Candidate Groups</span>
                ) : (
                  `${selectedGroupCount} selected`
                )}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {groupsOpen && (
              <div className={`absolute left-0 right-0 ${groupsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}> 
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-600">Groups</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedGroupIds([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
                {candidateGroups.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No groups found.</div>
                ) : (
                  <ul className="py-1">
                    {candidateGroups.map((g) => (
                      <li key={g.CandidateGroupId} className="px-3 py-1 hover:bg-gray-50">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedGroupIds.includes(g.CandidateGroupId)}
                            onChange={(e) => {
                              setSelectedGroupIds((prev) =>
                                e.target.checked
                                  ? Array.from(new Set([...prev, g.CandidateGroupId]))
                                  : prev.filter((id) => id !== g.CandidateGroupId)
                              );
                            }}
                          />
                          <span className="truncate">{g.GroupName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
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
                {(() => {
                  if (selectedProductCount === 0) return <span className="text-gray-500">Select products</span>;
                  const names = selectedProductIds
                    .map((id) => productNameById.get(id))
                    .filter((n): n is string => typeof n === 'string' && n.trim() !== '');
                  if (names.length === 0) return <span className="text-gray-500">Select products</span>;
                  if (names.length <= 2) return names.join(", ");
                  return `${names.length} selected`;
                })()}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {productsOpen && (
              <div className={`absolute left-0 right-0 ${productsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-600">Products</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProductIds([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
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
      {/* Instruction panel removed for this step */}
    </div>
  );
}
