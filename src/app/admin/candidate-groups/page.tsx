"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { PlusCircle, Trash2, Filter, XCircle, Users } from "lucide-react";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchCandidateGroupsODataAction, deleteCandidateGroupAction, type CandidateGroupRow } from "@/app/actions/admin/candidateGroups";
import PaginationControls from "@/components/PaginationControls";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: CandidateGroupRow }) {
  const row: any = props.data;
  const depth = row._depth || 0;
  const hasKids = !!row._hasChildren;
  const expanded = !!row._expanded;
  return (
    <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
      {hasKids && (
        <button
          type="button"
          onClick={() => row._toggle?.(row.id)}
          className="w-5 h-5 flex items-center justify-center mr-1 text-gray-700 border border-gray-300 rounded text-[10px] leading-none font-semibold bg-white hover:bg-indigo-50"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>
      )}
      <Link href={`/admin/candidate-groups/${row.id}/edit`} className="text-blue-600 hover:underline truncate max-w-full" title={props.value}>
        {props.value}
      </Link>
    </div>
  );
}

function StatusCell(props: { value: number }) {
  const act = Number(props.value) === 1;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${act ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{act ? 'Active' : 'Inactive'}</span>;
}

export default function CandidateGroupsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CandidateGroupRow[]>([]); // full fetched list
  const [flatVisible, setFlatVisible] = useState<CandidateGroupRow[]>([]); // flattened according to expansion
  const [total, setTotal] = useState(0); // total visible
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CandidateGroupRow[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const sortModelRef = useRef<any[]>([]);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const firstLoadRef = useRef(true);
  const gridShellRef = useRef<HTMLDivElement | null>(null);
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  const activeFetchRef = useRef(0);
  const MIN_LOADER_MS = 900;

  const formatDate = (val?: string | number) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Internal hierarchical selection state (ensures collapsed descendants are selected)
  const selectionRef = useRef<Set<number>>(new Set());
  const [selectionVersion, setSelectionVersion] = useState(0);
  const childrenMapRef = useRef<Record<number, number[]>>({});
  const parentMapRef = useRef<Record<number, number | null>>({});

  const rebuildMaps = useCallback(() => {
    const cm: Record<number, number[]> = {};
    const pm: Record<number, number | null> = {};
    rows.forEach(r => { pm[r.id] = r.parentId || 0; (cm[r.parentId] ||= []).push(r.id); });
    Object.values(cm).forEach(a => a.sort((a, b) => a - b));
    childrenMapRef.current = cm; parentMapRef.current = pm;
  }, [rows]);
  useEffect(() => { rebuildMaps(); }, [rebuildMaps]);

  const collectDesc = useCallback((id: number, acc: number[] = []) => { acc.push(id); (childrenMapRef.current[id] || []).forEach(c => collectDesc(c, acc)); return acc; }, []);
  const updateAncestors = useCallback((id: number) => {
    const set = selectionRef.current; let cur = parentMapRef.current[id];
    while (cur && cur !== 0) { const kids = childrenMapRef.current[cur] || []; const any = kids.some(k => set.has(k)); const all = kids.length > 0 && kids.every(k => set.has(k)); if (!any) set.delete(cur); else if (all) set.add(cur); else set.delete(cur); cur = parentMapRef.current[cur]; }
  }, []);
  const selectNode = useCallback((id: number) => { const set = selectionRef.current; collectDesc(id).forEach(d => set.add(d)); updateAncestors(id); setSelectionVersion(v => v + 1); }, [collectDesc, updateAncestors]);
  const deselectNode = useCallback((id: number) => { const set = selectionRef.current; collectDesc(id).forEach(d => set.delete(d)); updateAncestors(id); setSelectionVersion(v => v + 1); }, [collectDesc, updateAncestors]);
  const toggleNode = useCallback((id: number) => { selectionRef.current.has(id) ? deselectNode(id) : selectNode(id); }, [selectNode, deselectNode]);
  const getState = useCallback((id: number) => { const set = selectionRef.current; const sel = set.has(id); const kids = childrenMapRef.current[id] || []; if (!kids.length) return sel ? 'all' : 'none'; const kidSel = kids.filter(k => set.has(k)).length; if (kidSel === 0 && !sel) return 'none'; if (kidSel === kids.length && sel) return 'all'; return 'partial'; }, []);
  useEffect(() => { setSelectedCount(selectionRef.current.size); }, [selectionVersion]);

  const SelectionCheckbox = useCallback((p: any) => { const row: CandidateGroupRow = p.data; const state = getState(row.id); return (<div className="flex items-center justify-center"><input type="checkbox" aria-label="Select row" checked={selectionRef.current.has(row.id)} ref={el => { if (el) el.indeterminate = state === 'partial'; }} onChange={() => toggleNode(row.id)} className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></div>); }, [getState, toggleNode, selectionVersion]);

  const columnDefs = useMemo<ColDef<CandidateGroupRow>[]>(() => [
    { colId: 'select', headerName: '', width: 46, pinned: 'left', sortable: false, filter: false, resizable: false, suppressMovable: true, cellRenderer: SelectionCheckbox },
    { field: 'name', headerName: 'Group', width: 920, sortable: true, filter: 'agTextColumnFilter', cellRenderer: NameCellRenderer },
    { field: 'language', headerName: 'Language', width: 480, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'isActive', headerName: 'Status', width: 140, sortable: true, filter: 'agTextColumnFilter', cellRenderer: StatusCell },
    { field: 'createdBy', headerName: 'Created By', width: 240, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'createdDate', headerName: 'Created Date', width: 260, sortable: true, valueFormatter: p => formatDate(p.value) },
    { field: 'modifiedDate', headerName: 'Updated Date', width: 260, sortable: true, valueFormatter: p => formatDate(p.value) },
    { field: 'id', hide: true },
  ], [showFilters, SelectionCheckbox]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const buildServerFilter = () => {
    const filters: string[] = [];
    const fm = filterModelRef.current || {};
    Object.entries(fm).forEach(([field, cfg]: any) => {
      if (!cfg) return;
      const map: Record<string, string> = {
        name: 'CandidateGroupName',
        parentId: 'ParentId',
        language: 'Language',
        isActive: 'IsActive',
        createdDate: 'CreatedDate',
        modifiedDate: 'ModifiedDate'
      };
      const serverField = map[field] || field;
      if (cfg.filterType === 'text' && cfg.filter) {
        const value = cfg.filter.replace(/'/g, "''");
        if (field === 'isActive') {
          const v = value.toLowerCase();
          if (["active", "1", "true"].includes(v)) { filters.push(`${serverField} eq 1`); return; }
          if (["inactive", "0", "false"].includes(v)) { filters.push(`${serverField} eq 0`); return; }
        }
        switch (cfg.type) {
          case 'startsWith': filters.push(`startswith(${serverField},'${value}')`); break;
          case 'endsWith': filters.push(`endswith(${serverField},'${value}')`); break;
          case 'equals': filters.push(`${serverField} eq '${value}'`); break;
          default: filters.push(`contains(${serverField},'${value}')`); break;
        }
      } else if (cfg.filter !== undefined) {
        const value = String(cfg.filter).replace(/'/g, "''");
        if (field === 'isActive') {
          const v = value.toLowerCase();
          if (["active", "1", "true"].includes(v)) { filters.push(`${serverField} eq 1`); return; }
          if (["inactive", "0", "false"].includes(v)) { filters.push(`${serverField} eq 0`); return; }
        }
        filters.push(`contains(${serverField},'${value}')`);
      }
    });
    if (query.trim()) filters.push(`contains(CandidateGroupName,'${query.trim().replace(/'/g, "''")}')`);
    return filters.length ? filters.join(' and ') : undefined;
  };

  const fetchPage = async () => {
    // Freeze current grid height to avoid jump while reloading
    if (gridShellRef.current) {
      const h = gridShellRef.current.offsetHeight;
      if (h > 0) setFrozenHeight(h);
    }
    const fetchId = ++activeFetchRef.current;
    const startTs = performance.now();
    setLoading(true);
    const sort = sortModelRef.current?.[0];
    const sortFieldMap: Record<string, string> = {
      name: 'CandidateGroupName',
      parentId: 'ParentId',
      language: 'Language',
      isActive: 'IsActive',
      createdDate: 'CreatedDate',
      modifiedDate: 'ModifiedDate'
    };
    const orderBy = sort ? `${sortFieldMap[sort.colId] || 'CreatedDate'} ${sort.sort}` : 'CreatedDate desc';
    const filter = buildServerFilter();
    // Fetch a large upper bound to build hierarchy locally
    const res = await fetchCandidateGroupsODataAction({ top: 2000, skip: 0, orderBy, filter });
    if (res.status === 200 && res.data) {
      const list = res.data.rows.slice();
      setRows(list);
    } else {
      setToast({ message: res.message || 'Failed to fetch candidate groups', type: 'error' });
    }
    const elapsed = performance.now() - startTs;
    const finalize = () => {
      if (fetchId !== activeFetchRef.current) return; // ignore stale
      setLoading(false);
      if (firstLoadRef.current) firstLoadRef.current = false;
    };
    if (elapsed < MIN_LOADER_MS) {
      setTimeout(finalize, MIN_LOADER_MS - elapsed);
    } else finalize();
  };

  useEffect(() => { fetchPage(); }, [query]);

  // Expanded state (persist across paging)
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setTimeout(() => { try { gridApiRef.current?.refreshCells({ force: true }); } catch { } }, 0);
  };

  // Rebuild flattened visible list when rows or expansion changes
  useEffect(() => {
    const byId: Record<number, CandidateGroupRow> = Object.fromEntries(rows.map(r => [r.id, r]));
    const kids: Record<number, CandidateGroupRow[]> = {};
    rows.forEach(r => { (kids[r.parentId] ||= []).push(r); });
    const depth = (id: number, guard = 0): number => { const n = byId[id]; if (!n || !n.parentId || !byId[n.parentId] || guard > 50) return 0; return 1 + depth(n.parentId, guard + 1); };
    const out: CandidateGroupRow[] = [];
    const walk = (nodes: CandidateGroupRow[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      for (const n of nodes) {
        const meta: any = n;
        meta._depth = depth(n.id);
        meta._hasChildren = !!kids[n.id]?.length;
        meta._expanded = expanded.has(n.id);
        meta._toggle = (id: number) => toggle(id);
        out.push(n);
        if (expanded.has(n.id)) walk(kids[n.id] || []);
      }
    };
    walk(kids[0] || []);
    setFlatVisible(out);
    setTotal(out.length);
    const maxPage = Math.max(1, Math.ceil(out.length / pageSize));
    if (page > maxPage) setPage(1);
  }, [rows, expanded, page, pageSize]);

  const pagedRows = useMemo(() => flatVisible.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [flatVisible, page, pageSize]);

  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
        <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="Candidate Groups" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/candidate-groups/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New Group</button></Link>
            <button disabled={deleting || selectedCount === 0} onClick={() => {
              const ids = Array.from(selectionRef.current);
              if (!ids.length) { setToast({ message: 'Select groups to delete', type: 'info' }); return; }
              setPendingDelete(rows.filter(r => ids.includes(r.id)));
              setConfirmOpen(true);
            }} className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Delete</button>
            {selectedCount > 0 && <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">{selectedCount} selected</span>}
          </div>
          <div className="flex items-center gap-3">
            <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} pageSizeOptions={[15, 25, 50]} showTotalCount />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(v => !v)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}</button>
              <button onClick={() => { filterModelRef.current = {}; gridApiRef.current?.setFilterModel?.(null); setPage(1); fetchPage(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={!query && Object.keys(filterModelRef.current || {}).length === 0}><XCircle className="w-4 h-4" /> Clear Filters</button>
            </div>
          </div>
        </div>
        <div ref={gridShellRef} className="ag-theme-alpine ag-theme-evalus w-full flex-1 min-h-0 relative" style={frozenHeight && loading ? { minHeight: frozenHeight } : undefined}>
          <AgGridReact<CandidateGroupRow>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={pagedRows}
            getRowId={p => String(p.data.id)}
            onGridReady={e => { gridApiRef.current = e.api; }}
            headerHeight={36} rowHeight={32}
            onSortChanged={() => { sortModelRef.current = (gridApiRef.current as any)?.getSortModel?.() || []; setPage(1); fetchPage(); }}
            onFilterChanged={() => { const api = gridApiRef.current as any; if (!api) return; const fm = api.getFilterModel?.(); filterModelRef.current = fm || {}; if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current); filterDebounceRef.current = setTimeout(() => { setPage(1); fetchPage(); }, 300); }}
            theme="legacy"
            animateRows
          />
          {loading && (
            <GridOverlayLoader
              message={firstLoadRef.current ? "Loading groups..." : "Refreshing..."}
              backdropClassName={`${firstLoadRef.current ? 'bg-white/80' : 'bg-white/60'} backdrop-blur-md pointer-events-none`}
            />
          )}
        </div>
        <ConfirmationModal
          isOpen={confirmOpen}
          title="Confirm Delete"
          message={(function () {
            if (!pendingDelete.length) return 'No groups selected.';
            // Compute cascade counts similar to Subjects
            const all = new Set<number>();
            const byParent: Record<number, CandidateGroupRow[]> = {};
            rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
            const collect = (id: number) => {
              if (all.has(id)) return; all.add(id);
              (byParent[id] || []).forEach(c => collect(c.id));
            };
            pendingDelete.forEach(r => collect(r.id));
            const extra = all.size - pendingDelete.length;
            if (extra > 0) return `Delete ${pendingDelete.length} selected group(s) and ${extra} descendant group(s)? (Total: ${all.size})`;
            return pendingDelete.length === 1 ? `Delete group "${pendingDelete[0].name}"?` : `Delete ${pendingDelete.length} groups?`;
          })()}
          confirmText={deleting ? 'Deleting…' : 'Delete'}
          variant="danger"
          onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
          onConfirm={async () => {
            if (!pendingDelete.length) return; setDeleting(true);
            try {
              // Build children index
              const byParent: Record<number, CandidateGroupRow[]> = {};
              rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
              const all = new Map<number, { row: CandidateGroupRow; depth: number }>();
              const collect = (row: CandidateGroupRow, depth: number) => {
                if (all.has(row.id)) {
                  const existing = all.get(row.id)!;
                  if (depth > existing.depth) existing.depth = depth;
                } else all.set(row.id, { row, depth });
                (byParent[row.id] || []).forEach(child => collect(child, depth + 1));
              };
              pendingDelete.forEach(r => collect(r, 0));
              // Delete deepest first to avoid FK issues
              const toDelete = Array.from(all.values()).sort((a, b) => b.depth - a.depth);
              for (const { row } of toDelete) { await deleteCandidateGroupAction(row.id); }
              setToast({ message: `Deleted ${toDelete.length} item(s)`, type: 'success' }); selectionRef.current.clear(); setSelectionVersion(v => v + 1); setSelectedCount(0);
            } catch (e: any) {
              setToast({ message: 'Delete failed', type: 'error' });
            }
            fetchPage();
            setDeleting(false); setConfirmOpen(false); setPendingDelete([]);
          }}
        />
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
    </div>
  );
}
