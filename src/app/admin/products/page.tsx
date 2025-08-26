"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, PlusCircle, Trash2, XCircle, Filter, Pencil, CheckCircle2, XCircle as InactiveIcon } from "lucide-react";
import { fetchProductsAction, deleteProductAction, type ProductDto } from "@/app/actions/admin/products";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import Toast from "@/components/Toast";
import PaginationControls from "@/components/PaginationControls";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent, SortModelItem } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: ProductDto }) {
  return (
    <Link className="text-green-600 hover:underline" href={`/admin/products/${props.data.productId}`} title={`Edit ${props.value}`}>{props.value}</Link>
  );
}

function IsActiveCellRenderer(props: { value: number | boolean }) {
  const active = Boolean(props.value);
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// Date format dd-mm-yyyy
function formatDate(value?: string) {
  if (!value) return ""; const d = new Date(value); if (isNaN(d.getTime())) return ""; const day = String(d.getDate()).padStart(2,'0'); const mon = String(d.getMonth()+1).padStart(2,'0'); return `${day}-${mon}-${d.getFullYear()}`;
}

interface ProductRow extends ProductDto {}

function ProductsGrid({ query, onClearQuery }: { query: string; onClearQuery?: () => void }) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [allRows, setAllRows] = useState<ProductRow[]>([]);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductRow[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const sortModelRef = useRef<SortModelItem[] | undefined>(undefined);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const [filtersVersion, setFiltersVersion] = useState(0);

  const columnDefs = useMemo<ColDef<ProductRow>[]>(() => [
    { field: 'productName', headerName: 'Name', flex: 1.6, minWidth: 180, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] }, cellRenderer: NameCellRenderer },
    { field: 'language', headerName: 'Language', width: 140, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] } },
    { field: 'isActive', headerName: 'Status', width: 125, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] }, valueGetter: p => Boolean(p.data?.isActive) ? 'Active' : 'Inactive', cellRenderer: IsActiveCellRenderer },
    { field: 'createdBy', headerName: 'Created By', width: 140, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] } },
    { field: 'createdDate', headerName: 'Created Date', width: 140, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] }, valueFormatter: p => formatDate(p.value) },
    { field: 'modifiedBy', headerName: 'Modified By', width: 140, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] } },
    { field: 'modifiedDate', headerName: 'Modified Date', width: 140, sortable: true, filter: 'agTextColumnFilter', filterParams: { buttons: ['apply','reset','clear'] }, valueFormatter: p => formatDate(p.value) },
  ], [page, pageSize]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const recompute = useCallback(() => {
    let work = allRows.slice();
    // Search
    const search = (query || '').trim().toLowerCase();
    if (search) {
      work = work.filter(r => (r.productName || '').toLowerCase().includes(search) || (r.language||'').toLowerCase().includes(search));
    }
    // Filters (text contains only for now)
    Object.entries(filterModelRef.current || {}).forEach(([field, conf]: [string, any]) => {
      if (!conf) return; const val = (conf.filter || '').toLowerCase(); if (!val) return;
      work = work.filter(r => String((r as any)[field] || '').toLowerCase().includes(val));
    });
    // Sorting
    const sort = sortModelRef.current?.[0];
    if (sort) {
      const { colId, sort: dir } = sort; work.sort((a: any, b: any) => {
        const av = (a as any)[colId]; const bv = (b as any)[colId];
        if (av == null && bv != null) return -1; if (av != null && bv == null) return 1; if (av < bv) return dir === 'desc' ? 1 : -1; if (av > bv) return dir === 'desc' ? -1 : 1; return 0;
      });
    }
    const totalNew = work.length; setTotal(totalNew);
    const start = (page - 1) * pageSize; const slice = work.slice(start, start + pageSize);
    setRows(slice);
  }, [allRows, page, pageSize, query]);

  const load = useCallback(async () => {
    setLoading(true); const data = await fetchProductsAction(); setAllRows(data); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading) recompute(); }, [loading, recompute, filtersVersion]);
  useEffect(() => { if (!loading) recompute(); }, [page, pageSize, query]);

  const onGridReady = useCallback((e: GridReadyEvent) => { gridApiRef.current = e.api; }, []);
  const onSortChanged = useCallback(() => { const model = (gridApiRef.current as any)?.getSortModel?.() as SortModelItem[] | undefined; sortModelRef.current = model; setPage(1); recompute(); }, [recompute]);

  return (
    <div className="ag-theme-alpine ag-theme-evalus flex flex-col h-full min-h-0 w-full">
      <div className="mb-3 flex items-center justify-between gap-3 flex-none">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/products/new">
            <button type="button" className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-green-600 text-white text-sm shadow hover:bg-green-700" title="Create new product">
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </Link>
          <button
            type="button"
            onClick={() => {
              const api = gridApiRef.current; if (!api) return; const selected = api.getSelectedRows?.() as ProductRow[]; if (!selected || selected.length === 0) { setToast({ message: "Please select at least one product to delete.", type: "info" }); return; } setPendingDelete(selected); setConfirmOpen(true);
            }}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"
            title="Delete selected products"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
          {selectedCount > 0 && (
            <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">{selectedCount} selected</span>
          )}
        </div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
          pageSizeOptions={[15,25,50]}
          showTotalCount
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={() => {
              const api = gridApiRef.current as any; const hasSearch = !!(query && query.length); filterModelRef.current = {}; api?.setFilterModel?.(null); setFiltersVersion(v=>v+1); setPage(1); if (hasSearch && onClearQuery) { onClearQuery(); }
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Clear search and all column filters"
            disabled={!query && Object.keys(filterModelRef.current || {}).length === 0}
          >
            <XCircle className="w-4 h-4" /> Clear Filters
          </button>
        </div>
      </div>

      {(query || Object.keys(filterModelRef.current || {}).length > 0) && (
        <div className="mb-3 flex items-center flex-wrap gap-2 flex-none">
          <span className="text-xs text-gray-500">Active filters:</span>
          {query && (
            <button onClick={() => onClearQuery?.()} className="text-xs inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 hover:bg-blue-100" title="Clear search">Search: '{query}' <span className="text-blue-500">✕</span></button>
          )}
          {Object.entries(filterModelRef.current as Record<string, any>).map(([key, m]) => {
            const labelMap: Record<string,string> = { productName: 'Name', language: 'Language', isActive: 'Status', createdBy: 'Created By', createdDate: 'Created Date', modifiedBy: 'Modified By', modifiedDate: 'Modified Date' };
            const label = labelMap[key] || key; const val = m?.filter || ''; const short = val ? `${label}: contains '${val}'` : label;
            return (
              <button key={key} onClick={() => { const api = gridApiRef.current as any; const fm = { ...(filterModelRef.current || {}) }; delete fm[key]; filterModelRef.current = fm; api?.setFilterModel?.(fm); setFiltersVersion(v=>v+1); setPage(1); }} className="text-xs inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 px-3 py-1 hover:bg-gray-200" title="Remove this filter">{short}<span className="text-gray-500">✕</span></button>
            );
          })}
          <button onClick={() => { const api = gridApiRef.current as any; const hasSearch = !!(query && query.length); filterModelRef.current = {}; api?.setFilterModel?.(null); setFiltersVersion(v=>v+1); setPage(1); if (hasSearch && onClearQuery) { onClearQuery(); } }} className="text-xs inline-flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 px-3 py-1 hover:bg-gray-50" title="Clear all filters">Clear all</button>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {rows.length === 0 && !loading ? (
          <div className="bg-white shadow rounded-md border border-gray-300 p-8 h-full overflow-auto">
            <div className="text-center">
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-4">No products found. Try adjusting your search criteria or add new products.</p>
              <Link href="/admin/products/new"><button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-300">Add New Product</button></Link>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-0 relative">
            <AgGridReact<ProductRow>
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowData={rows}
              onGridReady={onGridReady}
              onSortChanged={onSortChanged}
              onFilterChanged={() => {
                const api = gridApiRef.current as any; if (!api) return; const fm = api.getFilterModel?.() as any; filterModelRef.current = fm || {}; setFiltersVersion(v=>v+1); if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current); filterDebounceRef.current = setTimeout(() => { setPage(1); }, 300); }}
              onSelectionChanged={() => { const api = gridApiRef.current; if (!api) return; const selected = api.getSelectedRows?.() as ProductRow[]; setSelectedCount(selected?.length || 0); }}
              pagination={false}
              rowSelection={{ mode: 'multiRow', checkboxes: true, enableClickSelection: true }}
              selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', resizable: false, cellClass: 'no-right-border', headerClass: 'no-right-border', suppressMovable: true }}
              animateRows
              headerHeight={36}
              rowHeight={32}
              tooltipShowDelay={300}
              suppressMenuHide={false}
              stopEditingWhenCellsLoseFocus={true}
              theme="legacy"
            />
            {loading && <GridOverlayLoader message="Loading products..." />}
          </div>
        )}
      </div>

      <style jsx global>{`
        .ag-theme-alpine.ag-theme-evalus .ag-cell.no-right-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border { border-right: none !important; }
        .ag-theme-alpine.ag-theme-evalus .ag-center-cols-container .ag-row .ag-cell.no-left-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-row .ag-header-cell.no-left-border { border-left: none !important; }
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border .ag-header-cell-resize,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-left-border .ag-header-cell-resize { display: none !important; }
      `}</style>

      <ConfirmationModal
        title="Confirm Delete"
        message={pendingDelete.length > 0 ? (pendingDelete.length === 1 ? `Are you sure you want to delete "${pendingDelete[0].productName}"? This action cannot be undone.` : `Are you sure you want to delete ${pendingDelete.length} products? This action cannot be undone.`) : ''}
        isOpen={confirmOpen}
        variant="danger"
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
        onConfirm={async () => {
          if (pendingDelete.length === 0) return; setDeleting(true); try { const results = await Promise.all(pendingDelete.map(p => deleteProductAction(p.productId))); const failed = results.filter(r => r.status !== 200); if (failed.length === 0) { setToast({ message: pendingDelete.length === 1 ? 'Product deleted successfully.' : `${pendingDelete.length} products deleted successfully.`, type: 'success' }); setAllRows(prev => prev.filter(r => !pendingDelete.some(pd => pd.productId === r.productId))); } else { setToast({ message: `${failed.length} products failed to delete.`, type: 'error' }); } const api = gridApiRef.current; api?.deselectAll?.(); setSelectedCount(0); } catch { setToast({ message: 'Delete operation failed', type: 'error' }); } setDeleting(false); setConfirmOpen(false); setPendingDelete([]); recompute(); }}
      />

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} durationMs={3000} />}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  useEffect(() => { if (typeof window === 'undefined') return; const saved = sessionStorage.getItem('admin-products-search') ?? ''; if (saved) setQuery(saved); }, []);
  useEffect(() => { if (typeof window === 'undefined') return; sessionStorage.setItem('admin-products-search', query); }, [query]);
  return (
    <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
        <PageHeader icon={<Box className="w-6 h-6 text-green-600" />} title="Products" showSearch searchValue={query} onSearch={e => setQuery(e)} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 min-h-0 overflow-hidden">
        <ProductsGrid query={query} onClearQuery={() => setQuery("")} />
      </div>
    </div>
  );
}
