"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { PlusCircle, Trash2, BookOpen, Filter, XCircle } from "lucide-react";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchSubjectsODataAction, deleteSubjectAction, type SubjectRow } from "@/app/actions/admin/subjects";

ModuleRegistry.registerModules([AllCommunityModule]);

// Manual hierarchy expand/collapse (since enterprise row grouping / treeData not available)
interface HierarchyContext {
    toggle: (id: number) => void;
    expanded: Set<number>;
    hasChildren: (id: number) => boolean;
    depth: (id: number) => number;
}

let hierarchyCtx: HierarchyContext; // quick closure-based injector

function NameCellRenderer(props: { value: string; data: SubjectRow }) {
    const row = props.data;
    const depth = hierarchyCtx.depth(row.id);
    const indent = depth * 16; // px
    const showToggle = hierarchyCtx.hasChildren(row.id);
    const expanded = hierarchyCtx.expanded.has(row.id);
    return (
        <div className="flex items-center" style={{ paddingLeft: indent }}>
            {showToggle && (
                <button
                    type="button"
                    onClick={() => hierarchyCtx.toggle(row.id)}
                    className="w-5 h-5 flex items-center justify-center mr-1 text-gray-700 border border-gray-300 rounded text-[10px] leading-none font-semibold bg-white hover:bg-indigo-50"
                    aria-label={expanded ? "Collapse" : "Expand"}
                >
                    {expanded ? '−' : '+'}
                </button>
            )}
            <Link
                href={`/admin/subjects/${row.id}/edit`}
                className="text-blue-600 hover:underline truncate max-w-full"
                title={props.value}
            >
                {props.value}
            </Link>
        </div>
    );
}

function StatusCell(props: { value: number }) {
    const act = Number(props.value) === 1;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${act ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{act ? 'Active' : 'Inactive'}</span>;
}

export default function SubjectsPage() {
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<SubjectRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const gridApiRef = useRef<GridApi | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<SubjectRow[]>([]);
    const [selectedCount, setSelectedCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    // We fetch all for hierarchy (pagination would break tree). Could add client pagination later.
    const [page, setPage] = useState(1); // retained if future pagination re-added
    const [pageSize, setPageSize] = useState(15);
    const sortModelRef = useRef<any[]>([]);
    const filterModelRef = useRef<any>({});
    const filterDebounceRef = useRef<any>(null);

        const formatDate = (val?: string | number) => {
            if (!val) return '';
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            const dd = String(d.getDate()).padStart(2,'0');
            const mm = String(d.getMonth()+1).padStart(2,'0');
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        };

        const columnDefs = useMemo<ColDef<SubjectRow>[]>(() => [
            { field: 'name', headerName: 'Subject', flex: 1, minWidth: 150, sortable: true, filter: 'agTextColumnFilter', cellRenderer: NameCellRenderer },
            { field: 'questionCount', headerName: 'Question Count', width: 130, sortable: true, filter: 'agNumberColumnFilter', valueFormatter: p => p.value ?? 0 },
            { field: 'language', headerName: 'Lang', width: 80, sortable: true, filter: 'agTextColumnFilter' },
            { field: 'isActive', headerName: 'Status', width: 90, sortable: false, filter: false, valueGetter: p => (Number(p.data?.isActive) === 1 ? 'Active' : 'Inactive') },
            { field: 'createdDate', headerName: 'Created', width: 120, sortable: true, valueFormatter: p => formatDate(p.value) },
            { field: 'modifiedDate', headerName: 'Updated', width: 120, sortable: true, valueFormatter: p => formatDate(p.value) },
            { field: 'id', hide: true },
        ], [showFilters]);

    const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

    const buildServerFilter = () => {
        const filters: string[] = [];
        const fm = filterModelRef.current || {};
        Object.entries(fm).forEach(([field, cfg]: any) => {
            if (!cfg) return;
            const map: Record<string, string> = {
                name: 'SubjectName',
                language: 'Language',
                isActive: 'IsActive',
                createdDate: 'CreatedDate',
                modifiedDate: 'ModifiedDate'
            };
            const serverField = map[field] || field;
            if (cfg.filterType === 'text' || cfg.type) {
                const value = (cfg.filter || '').replace(/'/g, "''");
                switch (cfg.type) {
                    case 'startsWith': filters.push(`startswith(${serverField},'${value}')`); break;
                    case 'endsWith': filters.push(`endswith(${serverField},'${value}')`); break;
                    case 'equals': filters.push(`${serverField} eq '${value}'`); break;
                    default: filters.push(`contains(${serverField},'${value}')`); break;
                }
            } else if (cfg.filter !== undefined) {
                const value = String(cfg.filter).replace(/'/g, "''");
                if (field === 'isActive') {
                    const lv = value.toLowerCase();
                    if (['active', '1', 'true', 'yes'].includes(lv)) filters.push(`IsActive eq 1`);
                    else if (['inactive', '0', 'false', 'no'].includes(lv)) filters.push(`IsActive eq 0`);
                } else {
                    filters.push(`contains(${serverField},'${value}')`);
                }
            }
        });
        if (query.trim()) filters.push(`contains(SubjectName,'${query.trim().replace(/'/g, "''")}')`);
        return filters.length ? filters.join(' and ') : undefined;
    };

    // Manual hierarchy build & aggregation
    const fetchPage = async () => {
        setLoading(true);
        const sort = sortModelRef.current?.[0];
        const sortFieldMap: Record<string, string> = {
            name: 'SubjectName',
            questionCount: 'QuestionCount',
            language: 'Language',
            isActive: 'IsActive',
            createdDate: 'CreatedDate',
            modifiedDate: 'ModifiedDate'
        };
        const orderBy = sort ? `${sortFieldMap[sort.colId] || 'SubjectName'} ${sort.sort}` : 'SubjectName asc';
        const filter = buildServerFilter();
        // Fetch all (large $top) for hierarchy
        const res = await fetchSubjectsODataAction({ top: 2000, skip: 0, orderBy, filter });
        if (res.status === 200 && res.data) {
            const list = res.data.rows;
            // Build children map
            const children: Record<number, SubjectRow[]> = {};
            list.forEach(r => { if (!children[r.parentId]) children[r.parentId] = []; children[r.parentId].push(r); });
            // Aggregate counts recursively
            const sumCache: Record<number, number> = {};
            const sum = (id: number): number => {
                if (sumCache[id] !== undefined) return sumCache[id];
                const node = list.find(r => r.id === id); if (!node) return 0;
                const kids = children[id] || [];
                const my = Number(node.questionCount) || 0;
                if (!kids.length) { sumCache[id] = my; return my; }
                const totalKids = kids.reduce((acc, k) => acc + sum(k.id), 0);
                const totalSum = my + totalKids; sumCache[id] = totalSum; return totalSum;
            };
            list.forEach(r => { r.questionCount = sum(r.id); });
            setRows(list);
            setTotal(list.length);
            // prepare hierarchy context functions
            setHierarchyHelpers(list);
        } else setToast({ message: res.message || 'Failed to fetch subjects', type: 'error' });
        setLoading(false);
    };

    useEffect(() => { fetchPage(); }, [query]);

    // Expanded state for manual hierarchy
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const toggle = (id: number) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const [flatVisible, setFlatVisible] = useState<SubjectRow[]>([]);
    const setHierarchyHelpers = (all: SubjectRow[]) => {
        const byId: Record<number, SubjectRow> = Object.fromEntries(all.map(r => [r.id, r]));
        const children: Record<number, SubjectRow[]> = {};
        all.forEach(r => { (children[r.parentId] ||= []).push(r); });
        const depth = (id: number, guard = 0): number => { const node = byId[id]; if (!node || !node.parentId || !byId[node.parentId] || guard > 50) return 0; return 1 + depth(node.parentId, guard + 1); };
        const hasChildren = (id: number) => !!children[id]?.length;
        hierarchyCtx = { toggle, expanded, hasChildren, depth };
        // Build visible flat list
        const out: SubjectRow[] = [];
        const walk = (nodes: SubjectRow[]) => {
            nodes.sort((a, b) => a.name.localeCompare(b.name));
            for (const n of nodes) {
                out.push(n);
                if (expanded.has(n.id)) walk(children[n.id] || []);
            }
        };
        walk(children[0] || []); // roots parentId=0
        setFlatVisible(out);
    };

    // Recompute visible list when expansion changes
    useEffect(() => { setHierarchyHelpers(rows); }, [expanded, rows]);

    // Cleanup resize listener if added
    useEffect(() => {
        return () => {
            try {
                const api: any = gridApiRef.current;
                if (api && api.__resizeHandler) window.removeEventListener('resize', api.__resizeHandler);
            } catch { }
        };
    }, []);

    return (
        <div className="p-4 bg-gray-50 h-full flex flex-col">
            <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
                <PageHeader icon={<BookOpen className="w-6 h-6 text-indigo-600" />} title="Subjects" showSearch searchValue={query} onSearch={setQuery} />
            </div>
            <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link href="/admin/subjects/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New</button></Link>
                        <button disabled={deleting} onClick={() => {
                            const sel = gridApiRef.current?.getSelectedRows?.() as SubjectRow[];
                            if (!sel?.length) { setToast({ message: 'Select subjects to delete', type: 'info' }); return; }
                            setPendingDelete(sel); setConfirmOpen(true);
                        }} className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Delete</button>
                        {selectedCount > 0 && <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">{selectedCount} selected</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowFilters(v => !v)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}</button>
                        <button onClick={() => { filterModelRef.current = {}; gridApiRef.current?.setFilterModel?.(null); setPage(1); fetchPage(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"><XCircle className="w-4 h-4" /> Clear Filters</button>
                    </div>
                </div>
                {/* Pagination removed for hierarchy (fetched full set) */}
                <div className="h-full min-h-0 ag-theme-alpine ag-theme-evalus w-full">
                    <AgGridReact<SubjectRow>
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        rowData={flatVisible}
                                    getRowId={params => String(params.data.id)}
                                    onGridReady={e => { 
                                        gridApiRef.current = e.api; 
                                        // Initial fit
                                        requestAnimationFrame(() => { try { e.api.sizeColumnsToFit(); } catch {} });
                                        const handler = () => { try { e.api.sizeColumnsToFit(); } catch {} };
                                        window.addEventListener('resize', handler);
                                        (e.api as any).__resizeHandler = handler;
                                    }}
                                    onFirstDataRendered={() => { try { gridApiRef.current?.sizeColumnsToFit(); } catch {} }}
                        rowSelection={{ mode: 'multiRow', checkboxes: true }}
                        selectionColumnDef={{ pinned: 'left', width: 44 }}
                        onSelectionChanged={() => setSelectedCount(gridApiRef.current?.getSelectedRows()?.length || 0)}
                        headerHeight={36} rowHeight={32}
                        onSortChanged={() => { sortModelRef.current = (gridApiRef.current as any)?.getSortModel?.() || []; fetchPage(); }}
                        onFilterChanged={() => {
                            const api = gridApiRef.current as any; if (!api) return;
                            const fm = api.getFilterModel?.(); filterModelRef.current = fm || {};
                            if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
                            filterDebounceRef.current = setTimeout(() => { fetchPage(); }, 300);
                        }}
                        theme="legacy"
                    />
                    {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm">Loading…</div>}
                </div>
                <ConfirmationModal isOpen={confirmOpen} title="Confirm Delete" message={pendingDelete.length === 1 ? `Delete subject "${pendingDelete[0].name}"?` : `Delete ${pendingDelete.length} subjects?`} confirmText={deleting ? 'Deleting…' : 'Delete'} variant="danger" onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }} onConfirm={async () => {
                    if (!pendingDelete.length) return; setDeleting(true);
                    for (const s of pendingDelete) { await deleteSubjectAction(s.id); }
                    fetchPage();
                    setDeleting(false); setConfirmOpen(false); setPendingDelete([]); setToast({ message: 'Deleted', type: 'success' });
                }} />
            </div>
            <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
        </div>
    );
}
