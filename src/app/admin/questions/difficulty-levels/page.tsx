"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HelpCircle, Filter, XCircle, PlusCircle, Trash2 } from "lucide-react";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import PaginationControls from "@/components/PaginationControls";
import ConfirmationModal from "@/components/ConfirmationModal";
import { fetchQuestionDifficultyLevelsAction, deleteQuestionDifficultyLevelAction, type DifficultyLevelRow } from "@/app/actions/admin/question-difficulty-levels";
import { maskAdminId } from "@/utils/urlMasking";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: DifficultyLevelRow }) {
  return (
    <Link href={`/admin/questions/difficulty-levels/${maskAdminId(props.data.id)}/edit`} className="text-blue-600 hover:underline" title={props.value}>
      {props.value}
    </Link>
  );
}

function StatusCell(props: { value: number }) {
  const act = Number(props.value) === 1;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${act ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{act ? 'Active' : 'Inactive'}</span>;
}

function LanguageCell(props: { value: string }) {
  if (!props.value) return null;
  return <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{props.value}</span>;
}

export default function QuestionDifficultyLevelsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DifficultyLevelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DifficultyLevelRow[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const filterModelRef = useRef<any>({});
  const sortModelRef = useRef<any[]>([]);
  const filterDebounceRef = useRef<any>(null);
  const firstLoadRef = useRef(true);

  const formatDate = (val?: string | number) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const columnDefs = useMemo<ColDef<DifficultyLevelRow>[]>(() => [
    { field: 'name', headerName: 'Difficulty Level', minWidth: 200, flex: 1.2, sortable: true, filter: 'agTextColumnFilter', cellRenderer: NameCellRenderer },
    { field: 'language', headerName: 'Language', minWidth: 120, sortable: true, filter: 'agTextColumnFilter', cellRenderer: LanguageCell },
    { field: 'isActive', headerName: 'Status', minWidth: 110, sortable: true, filter: 'agTextColumnFilter', cellRenderer: StatusCell },
    { field: 'createdBy', headerName: 'Created By', minWidth: 140, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'createdDate', headerName: 'Created Date', minWidth: 140, sortable: true, valueFormatter: p => formatDate(p.value) },
    { field: 'modifiedDate', headerName: 'Modified Date', minWidth: 160, sortable: true, valueFormatter: p => formatDate(p.value) },
    { field: 'id', hide: true },
  ], [showFilters]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const buildFilter = () => {
    const filters: string[] = [];
    const fm = filterModelRef.current || {};
    Object.entries(fm).forEach(([field, cfg]: any) => {
      if (!cfg) return;
      const map: Record<string, string> = {
        name: 'QuestionDifficultylevel1',
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
        if (field === 'isActive') {
          const v = value.toLowerCase();
          if (["active", "1", "true"].includes(v)) { filters.push(`${serverField} eq 1`); return; }
          if (["inactive", "0", "false"].includes(v)) { filters.push(`${serverField} eq 0`); return; }
        }
        filters.push(`contains(${serverField},'${value}')`);
      }
    });
    if (query.trim()) filters.push(`contains(QuestionDifficultylevel1,'${query.trim().replace(/'/g, "''")}')`);
    return filters.length ? filters.join(' and ') : undefined;
  };

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string, string> = {
      name: 'QuestionDifficultylevel1',
      language: 'Language',
      isActive: 'IsActive',
      createdDate: 'CreatedDate',
      modifiedDate: 'ModifiedDate'
    };
    const orderBy = sort ? `${fieldMap[sort.colId] || 'ModifiedDate'} ${sort.sort}` : 'ModifiedDate desc';
    const filter = buildFilter();
    const res = await fetchQuestionDifficultyLevelsAction({ top: pageSize, skip: (page - 1) * pageSize, orderBy, filter });
    if (res.status === 200 && res.data) {
      setRows(res.data.rows);
      setTotal(res.data.total);
    } else {
      setToast({ message: res.message || 'Failed to fetch difficulty levels', type: 'error' });
    }
    setLoading(false);
  }, [page, pageSize, query]);

  useEffect(() => { fetchPage(); }, [fetchPage]);


  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
        <PageHeader icon={<HelpCircle className="w-6 h-6 text-indigo-600" />} title="Question Difficulty Levels" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/questions/difficulty-levels/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New</button></Link>
            <button
              disabled={deleting || selectedCount === 0}
              onClick={() => {
                const sel = gridApiRef.current?.getSelectedRows?.() as DifficultyLevelRow[];
                if (!sel?.length) { setToast({ message: 'Select rows to delete', type: 'info' }); return; }
                setPendingDelete(sel); setConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50">
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
        <div className="ag-theme-alpine ag-theme-evalus w-full flex-1 min-h-0 relative">
          <AgGridReact<DifficultyLevelRow>
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
            theme="legacy"
            animateRows
          />
          {loading && (
            <GridOverlayLoader
              message={firstLoadRef.current ? "Loading difficulty levels..." : "Refreshing..."}
              backdropClassName={`${firstLoadRef.current ? 'bg-white/80' : 'bg-white/60'} backdrop-blur-md pointer-events-none`}
            />
          )}
        </div>
        <ConfirmationModal
          isOpen={confirmOpen}
          title="Confirm Delete"
          message={(function () {
            if (!pendingDelete.length) return 'No items selected.';
            return pendingDelete.length === 1 ? `Delete \"${pendingDelete[0].name}\"?` : `Delete ${pendingDelete.length} items?`;
          })()}
          confirmText={deleting ? 'Deleting…' : 'Delete'}
          variant="danger"
          onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
          onConfirm={async () => {
            if (!pendingDelete.length) return; setDeleting(true);
            try {
              for (const row of pendingDelete) {
                await deleteQuestionDifficultyLevelAction(row.id);
              }
              setToast({ message: `Deleted ${pendingDelete.length} item(s)`, type: 'success' });
              fetchPage();
            } catch { setToast({ message: 'Delete failed', type: 'error' }); }
            setDeleting(false); setConfirmOpen(false); setPendingDelete([]);
          }}
        />
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
    </div>
  );
}
