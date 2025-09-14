"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { PlusCircle, Trash2, Filter, XCircle, BookOpenText } from "lucide-react";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchPublishedDocumentFoldersODataAction, deletePublishedDocumentFolderAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";
import PaginationControls from "@/components/PaginationControls";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: PublishedDocumentFolderRow }) {
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
      <Link href={`/admin/published-documents/folders/${row.id}/edit`} className="text-blue-600 hover:underline truncate max-w-full" title={props.value}>
        {props.value}
      </Link>
    </div>
  );
}

export default function PublishedDocumentFoldersPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PublishedDocumentFolderRow[]>([]);
  const [flatVisible, setFlatVisible] = useState<PublishedDocumentFolderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PublishedDocumentFolderRow[]>([]);
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

  const columnDefs = useMemo<ColDef<PublishedDocumentFolderRow>[]>(() => [
    { field: 'name', headerName: 'Folder Name', minWidth: 220, flex: 1.6, sortable: true, filter: 'agTextColumnFilter', cellRenderer: NameCellRenderer, checkboxSelection: false, headerCheckboxSelection: false },
    { field: 'language', headerName: 'Language', width: 160, sortable: true, filter: 'agTextColumnFilter', checkboxSelection: false, headerCheckboxSelection: false },
    { field: 'id', hide: true },
    { field: 'parentId', hide: true },
  ], [showFilters]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const buildServerFilter = () => {
    const filters: string[] = [];
    const fm = filterModelRef.current || {};
    Object.entries(fm).forEach(([field, cfg]: any) => {
      if (!cfg) return;
      const map: Record<string, string> = {
        name: 'PublishedDocumentFolderName',
        parentId: 'ParentId',
        language: 'Language',
      };
      const serverField = map[field] || field;
      if (cfg.filterType === 'text' && cfg.filter) {
        const value = String(cfg.filter).replace(/'/g, "''");
        switch (cfg.type) {
          case 'startsWith': filters.push(`startswith(${serverField},'${value}')`); break;
          case 'endsWith': filters.push(`endswith(${serverField},'${value}')`); break;
          case 'equals': filters.push(`${serverField} eq '${value}'`); break;
          default: filters.push(`contains(${serverField},'${value}')`); break;
        }
      } else if (cfg.filter !== undefined) {
        const value = String(cfg.filter).replace(/'/g, "''");
        filters.push(`contains(${serverField},'${value}')`);
      }
    });
    if (query.trim()) filters.push(`contains(PublishedDocumentFolderName,'${query.trim().replace(/'/g, "''")}')`);
    return filters.length ? filters.join(' and ') : undefined;
  };

  const fetchPage = async () => {
    if (gridShellRef.current) {
      const h = gridShellRef.current.offsetHeight;
      if (h > 0) setFrozenHeight(h);
    }
    const fetchId = ++activeFetchRef.current;
    const startTs = performance.now();
    setLoading(true);
    const sort = sortModelRef.current?.[0];
    const sortFieldMap: Record<string, string> = {
      name: 'PublishedDocumentFolderName',
      parentId: 'ParentId',
      language: 'Language',
    };
    const orderBy = sort ? `${sortFieldMap[sort.colId] || 'PublishedDocumentFolderName'} ${sort.sort}` : 'PublishedDocumentFolderName asc';
    const filter = buildServerFilter();
    const res = await fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy, filter });
    if (res.status === 200 && res.data) {
      setRows(res.data.rows.slice());
    } else {
      setToast({ message: res.message || 'Failed to fetch folders', type: 'error' });
    }
    const elapsed = performance.now() - startTs;
    const finalize = () => { if (fetchId !== activeFetchRef.current) return; setLoading(false); if (firstLoadRef.current) firstLoadRef.current = false; };
    if (elapsed < MIN_LOADER_MS) setTimeout(finalize, MIN_LOADER_MS - elapsed); else finalize();
  };

  useEffect(() => { fetchPage(); }, [query]);

  // Tree flattening similar to Candidate Groups
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) => { setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); setTimeout(() => { try { gridApiRef.current?.refreshCells({ force: true }); } catch { } }, 0); };

  useEffect(() => {
    const byId: Record<number, PublishedDocumentFolderRow> = Object.fromEntries(rows.map(r => [r.id, r]));
    const kids: Record<number, PublishedDocumentFolderRow[]> = {};
    rows.forEach(r => { (kids[r.parentId] ||= []).push(r); });
    const depth = (id: number, guard = 0): number => { const n = byId[id]; if (!n || !n.parentId || !byId[n.parentId] || guard > 50) return 0; return 1 + depth(n.parentId, guard + 1); };
    const out: PublishedDocumentFolderRow[] = [];
    const walk = (nodes: PublishedDocumentFolderRow[]) => {
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
        <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600" />} title="Publish Documents folder" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/published-documents/folders/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New Folder</button></Link>
            <button disabled={deleting || selectedCount === 0} onClick={() => {
              const sel = gridApiRef.current?.getSelectedRows?.() as PublishedDocumentFolderRow[];
              if (!sel?.length) { setToast({ message: 'Select folders to delete', type: 'info' }); return; }
              setPendingDelete(sel); setConfirmOpen(true);
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
          <AgGridReact<PublishedDocumentFolderRow>
            columnDefs={columnDefs}
            selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', suppressMovable: true, resizable: false }}
            defaultColDef={defaultColDef}
            rowData={pagedRows}
            getRowId={p => String(p.data.id)}
            onGridReady={e => { gridApiRef.current = e.api; }}
            rowSelection={{ mode: 'multiRow' }}
            onSelectionChanged={() => setSelectedCount(gridApiRef.current?.getSelectedRows()?.length || 0)}
            headerHeight={36} rowHeight={32}
            onSortChanged={() => { sortModelRef.current = (gridApiRef.current as any)?.getSortModel?.() || []; setPage(1); fetchPage(); }}
            onFilterChanged={() => { const api = gridApiRef.current as any; if (!api) return; const fm = api.getFilterModel?.(); filterModelRef.current = fm || {}; if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current); filterDebounceRef.current = setTimeout(() => { setPage(1); fetchPage(); }, 300); }}
            theme="legacy"
            animateRows
          />
          {loading && (
            <GridOverlayLoader
              message={firstLoadRef.current ? "Loading folders..." : "Refreshing..."}
              backdropClassName={`${firstLoadRef.current ? 'bg-white/80' : 'bg-white/60'} backdrop-blur-md pointer-events-none`}
            />
          )}
        </div>
        <ConfirmationModal
          isOpen={confirmOpen}
          title="Confirm Delete"
          message={(function () {
            if (!pendingDelete.length) return 'No folders selected.';
            const all = new Set<number>();
            const byParent: Record<number, PublishedDocumentFolderRow[]> = {};
            rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
            const collect = (id: number) => { if (all.has(id)) return; all.add(id); (byParent[id] || []).forEach(c => collect(c.id)); };
            pendingDelete.forEach(r => collect(r.id));
            const extra = all.size - pendingDelete.length;
            if (extra > 0) return `Delete ${pendingDelete.length} selected folder(s) and ${extra} descendant folder(s)? (Total: ${all.size})`;
            return pendingDelete.length === 1 ? `Delete folder "${pendingDelete[0].name}"?` : `Delete ${pendingDelete.length} folder(s)?`;
          })()}
          confirmText={deleting ? 'Deleting…' : 'Delete'}
          variant="danger"
          onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
          onConfirm={async () => {
            if (!pendingDelete.length) return; setDeleting(true);
            try {
              const byParent: Record<number, PublishedDocumentFolderRow[]> = {};
              rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
              const all = new Map<number, { row: PublishedDocumentFolderRow; depth: number }>();
              const collect = (row: PublishedDocumentFolderRow, depth: number) => {
                if (all.has(row.id)) { const existing = all.get(row.id)!; if (depth > existing.depth) existing.depth = depth; }
                else all.set(row.id, { row, depth });
                (byParent[row.id] || []).forEach(child => collect(child, depth + 1));
              };
              pendingDelete.forEach(r => collect(r, 0));
              const toDelete = Array.from(all.values()).sort((a, b) => b.depth - a.depth);
              for (const { row } of toDelete) { await deletePublishedDocumentFolderAction(row.id); }
              setToast({ message: `Deleted ${toDelete.length} item(s)`, type: 'success' });
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
