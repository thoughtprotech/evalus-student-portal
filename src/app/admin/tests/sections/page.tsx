"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HelpCircle, Filter, XCircle, PlusCircle, Trash2 } from "lucide-react";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import PaginationControls from "@/components/PaginationControls";
import ConfirmationModal from "@/components/ConfirmationModal";
import { fetchTestSectionsAction, deleteTestSectionAction, type TestSectionRow } from "@/app/actions/admin/test-sections";
import { maskAdminId } from "@/utils/urlMasking";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: TestSectionRow }) {
  return (
    <Link className="text-blue-600 hover:underline" href={`/admin/tests/sections/${maskAdminId(props.data.id)}/edit`} title={props.value}>
      {props.value}
    </Link>
  );
}

function StatusCell(props: { value: number }) {
  const isActive = Number(props.value) === 1;
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function LanguageCell(props: { value?: string }) {
  if (!props.value) return null;
  return (
    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      {props.value}
    </span>
  );
}

export default function TestSectionsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<TestSectionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TestSectionRow[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const filterModelRef = useRef<any>({});
  const sortModelRef = useRef<any[]>([]);
  const filterDebounceRef = useRef<any>(null);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters, flex: 1, minWidth: 120 }), [showFilters]);

  const formatDate = (val?: string | number) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const columnDefs = useMemo<ColDef<TestSectionRow>[]>(() => [
    { headerName: "Section Name", field: "name", cellRenderer: NameCellRenderer, minWidth: 220 },
    { headerName: "Language", field: "language", cellRenderer: LanguageCell, width: 140 },
    { headerName: "Status", field: "isActive", cellRenderer: StatusCell, width: 140 },
    { headerName: "Created By", field: "createdBy", width: 160 },
    { headerName: "Created Date", field: "createdDate", valueFormatter: p => formatDate(p.value), width: 160 },
    { headerName: "Modified Date", field: "modifiedDate", valueFormatter: p => formatDate(p.value), width: 160 },
  ], []);

  const buildFilter = useCallback(() => {
    const filters: string[] = [];
    const fm = filterModelRef.current || {};
    Object.entries(fm).forEach(([field, cfg]: any) => {
      if (!cfg) return;
      const map: Record<string, string> = {
        name: 'TestSectionName',
        language: 'Language',
        isActive: 'IsActive',
        createdDate: 'CreatedDate',
        modifiedDate: 'ModifiedDate',
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
        filters.push(`contains(${serverField},'${value}')`);
      }
    });
    if (query.trim()) filters.push(`contains(TestSectionName,'${query.trim().replace(/'/g, "''")}')`);
    return filters.length ? filters.join(' and ') : undefined;
  }, [query]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const filter = buildFilter();
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string, string> = {
      name: 'TestSectionName',
      language: 'Language',
      isActive: 'IsActive',
      createdDate: 'CreatedDate',
      modifiedDate: 'ModifiedDate'
    };
    const orderBy = sort ? `${fieldMap[sort.colId] || 'ModifiedDate'} ${sort.sort}` : 'ModifiedDate desc';
    const res = await fetchTestSectionsAction({ top: pageSize, skip: (page - 1) * pageSize, orderBy, filter });
    if (res.status === 200 && res.data) { setRows(res.data.rows); setTotal(res.data.total); }
    setLoading(false);
  }, [page, pageSize, buildFilter]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return (
    <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
        <PageHeader icon={<HelpCircle className="w-6 h-6 text-indigo-600" />} title="Test Sections" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/tests/sections/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New</button></Link>
            <button
              disabled={deleting || selectedCount === 0}
              onClick={() => {
                const sel = gridApiRef.current?.getSelectedRows?.() as TestSectionRow[];
                if (!sel?.length) { setToast({ message: 'Select rows to delete', type: 'info' }); return; }
                setPendingDelete(sel); setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
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
        {showFilters ? (
          <div className="p-3 border border-gray-200 rounded mb-2 flex items-center gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Language</label>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={(e) => { filterModelRef.current = { ...(filterModelRef.current || {}), language: e.target.value || undefined }; setPage(1); fetchPage(); }}>
                <option value="">All</option>
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Status</label>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={(e) => { const v = e.target.value; filterModelRef.current = { ...(filterModelRef.current || {}), isActive: v === '' ? undefined : Number(v) }; setPage(1); fetchPage(); }}>
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        ) : null}
        <div className="ag-theme-alpine ag-theme-evalus w-full flex-1 min-h-0 relative">
          <AgGridReact<TestSectionRow>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={rows}
            getRowId={p => String(p.data.id)}
            onGridReady={e => { gridApiRef.current = e.api; }}
            rowSelection={{ mode: 'multiRow', checkboxes: true }}
            selectionColumnDef={{ pinned: 'left', width: 44 }}
            onSelectionChanged={() => setSelectedCount(gridApiRef.current?.getSelectedRows()?.length || 0)}
            headerHeight={36} rowHeight={32}
            onSortChanged={() => { sortModelRef.current = (gridApiRef.current as any)?.getSortModel?.() || []; setPage(1); fetchPage(); }}
            onFilterChanged={() => { const api = gridApiRef.current as any; if (!api) return; const fm = api.getFilterModel?.(); filterModelRef.current = fm || {}; if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current); filterDebounceRef.current = setTimeout(() => { setPage(1); fetchPage(); }, 300); }}
            overlayNoRowsTemplate="No sections found"
            overlayLoadingTemplate=""
            theme="legacy"
            animateRows
          />
          {loading ? <GridOverlayLoader message="Loading sections..." /> : null}
        </div>

        <ConfirmationModal
          isOpen={confirmOpen}
          title="Confirm Delete"
          message={`Delete ${pendingDelete.length} selected section(s)?`}
          confirmText={deleting ? 'Deleting…' : 'Delete'}
          variant="danger"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              for (const row of pendingDelete) {
                await deleteTestSectionAction(row.id);
              }
              fetchPage();
            } finally { setDeleting(false); setConfirmOpen(false); setPendingDelete([]); }
          }}
        />
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
    </div>
  );
}
