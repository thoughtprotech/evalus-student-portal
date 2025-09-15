"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { PlusCircle, Trash2, Filter, XCircle, Layers } from "lucide-react";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchTestCategoriesODataAction, deleteTestCategoryAction, type TestCategoryRow } from "@/app/actions/admin/test-categories";
import PaginationControls from "@/components/PaginationControls";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: TestCategoryRow }) {
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
            <Link href={`/admin/tests/categories/${row.id}/edit`} className="text-blue-600 hover:underline truncate max-w-full" title={props.value}>
                {props.value}
            </Link>
        </div>
    );
}

function StatusCell(props: { value: number }) {
    const act = Number(props.value) === 1;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${act ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{act ? 'Active' : 'Inactive'}</span>;
}

export default function TestCategoriesPage() {
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<TestCategoryRow[]>([]); // full fetched list
    const [flatVisible, setFlatVisible] = useState<TestCategoryRow[]>([]); // flattened according to expansion
    const [total, setTotal] = useState(0); // total visible
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const gridApiRef = useRef<GridApi | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<TestCategoryRow[]>([]);
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

    const columnDefs = useMemo<ColDef<TestCategoryRow>[]>(() => [
        { field: 'name', headerName: 'Category', width: 920, sortable: true, filter: 'agTextColumnFilter', cellRenderer: NameCellRenderer },
        { field: 'type', headerName: 'Type', width: 200, sortable: true, filter: 'agTextColumnFilter' },
        { field: 'language', headerName: 'Language', width: 240, sortable: true, filter: 'agTextColumnFilter' },
        { field: 'isActive', headerName: 'Status', width: 140, sortable: true, filter: 'agTextColumnFilter', cellRenderer: StatusCell },
        { field: 'createdBy', headerName: 'Created By', width: 240, sortable: true, filter: 'agTextColumnFilter' },
        { field: 'createdDate', headerName: 'Created Date', width: 260, sortable: true, valueFormatter: p => formatDate(p.value) },
        { field: 'modifiedDate', headerName: 'Updated Date', width: 260, sortable: true, valueFormatter: p => formatDate(p.value) },
        { field: 'id', hide: true },
    ], [showFilters]);

    const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

    const buildServerFilter = () => {
        const filters: string[] = [];
        const fm = filterModelRef.current || {};
        Object.entries(fm).forEach(([field, cfg]: any) => {
            if (!cfg) return;
            const map: Record<string, string> = {
                name: 'TestCategoryName',
                type: 'TestCategoryType',
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
        if (query.trim()) filters.push(`contains(TestCategoryName,'${query.trim().replace(/'/g, "''")}')`);
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
            name: 'TestCategoryName',
            type: 'TestCategoryType',
            parentId: 'ParentId',
            language: 'Language',
            isActive: 'IsActive',
            createdDate: 'CreatedDate',
            modifiedDate: 'ModifiedDate'
        };
        const orderBy = sort ? `${sortFieldMap[sort.colId] || 'CreatedDate'} ${sort.sort}` : 'CreatedDate desc';
        const filter = buildServerFilter();
        const res = await fetchTestCategoriesODataAction({ top: 2000, skip: 0, orderBy, filter });
        if (res.status === 200 && res.data) {
            const list = res.data.rows.slice();
            setRows(list);
        } else {
            setToast({ message: res.message || 'Failed to fetch test categories', type: 'error' });
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

    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const toggle = (id: number) => {
        setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        setTimeout(() => { try { gridApiRef.current?.refreshCells({ force: true }); } catch { } }, 0);
    };

    useEffect(() => {
        const byId: Record<number, TestCategoryRow> = Object.fromEntries(rows.map(r => [r.id, r]));
        const kids: Record<number, TestCategoryRow[]> = {};
        rows.forEach(r => { (kids[r.parentId] ||= []).push(r); });
        const depth = (id: number, guard = 0): number => { const n = byId[id]; if (!n || !n.parentId || !byId[n.parentId] || guard > 50) return 0; return 1 + depth(n.parentId, guard + 1); };
        const out: TestCategoryRow[] = [];
        const walk = (nodes: TestCategoryRow[]) => {
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
                <PageHeader icon={<Layers className="w-6 h-6 text-indigo-600" />} title="Test Categories" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
            </div>
            <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="mb-3 flex items-center justify-between gap-3 flex-none">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link href="/admin/tests/categories/new"><button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700 whitespace-nowrap"><PlusCircle className="w-4 h-4" /> New Category</button></Link>
                        <button disabled={deleting || selectedCount === 0} onClick={() => {
                            const sel = gridApiRef.current?.getSelectedRows?.() as TestCategoryRow[];
                            if (!sel?.length) { setToast({ message: 'Select categories to delete', type: 'info' }); return; }
                            setPendingDelete(sel); setConfirmOpen(true);
                        }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"><Trash2 className="w-4 h-4" /> Delete</button>
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
                    <AgGridReact<TestCategoryRow>
                        columnDefs={columnDefs}
                        selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', resizable: false, suppressMovable: true }}
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
                            message={firstLoadRef.current ? "Loading categories..." : "Refreshing..."}
                            backdropClassName={`${firstLoadRef.current ? 'bg-white/80' : 'bg-white/60'} backdrop-blur-md pointer-events-none`}
                        />
                    )}
                </div>
                <ConfirmationModal
                    isOpen={confirmOpen}
                    title="Confirm Delete"
                    message={(function () {
                        if (!pendingDelete.length) return 'No categories selected.';
                        const all = new Set<number>();
                        const byParent: Record<number, TestCategoryRow[]> = {};
                        rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
                        const collect = (id: number) => {
                            if (all.has(id)) return; all.add(id);
                            (byParent[id] || []).forEach(c => collect(c.id));
                        };
                        pendingDelete.forEach(r => collect(r.id));
                        const extra = all.size - pendingDelete.length;
                        if (extra > 0) return `Delete ${pendingDelete.length} selected item(s) and ${extra} descendant item(s)? (Total: ${all.size})`;
                        return pendingDelete.length === 1 ? `Delete category "${pendingDelete[0].name}"?` : `Delete ${pendingDelete.length} categories?`;
                    })()}
                    confirmText={deleting ? 'Deleting…' : 'Delete'}
                    variant="danger"
                    onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
                    onConfirm={async () => {
                        if (!pendingDelete.length) return; setDeleting(true);
                        try {
                            const byParent: Record<number, TestCategoryRow[]> = {};
                            rows.forEach(r => { (byParent[r.parentId] ||= []).push(r); });
                            const all = new Map<number, { row: TestCategoryRow; depth: number }>();
                            const collect = (row: TestCategoryRow, depth: number) => {
                                if (all.has(row.id)) {
                                    const existing = all.get(row.id)!;
                                    if (depth > existing.depth) existing.depth = depth;
                                } else all.set(row.id, { row, depth });
                                (byParent[row.id] || []).forEach(child => collect(child, depth + 1));
                            };
                            pendingDelete.forEach(r => collect(r, 0));
                            const toDelete = Array.from(all.values()).sort((a, b) => b.depth - a.depth);
                            for (const { row } of toDelete) {
                                await deleteTestCategoryAction(row.id);
                            }
                        } catch (e: any) {
                            // No toasts per delete UX harmonization; grid will refresh
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
