"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import GridOverlayLoader from "@/components/GridOverlayLoader";
import PaginationControls from "@/components/PaginationControls";
import { BookOpenText, Filter, PlusCircle, Trash2, XCircle, Pencil } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);
import { fetchPublishedDocumentsODataAction, deletePublishedDocumentAction, type PublishedDocumentRow } from "@/app/actions/admin/publishedDocuments";
import { fetchPublishedDocumentFoldersODataAction } from "@/app/actions/admin/publishedDocumentFolders";

type DocumentRow = {
  id: number;
  folderName: string;
  documentName: string;
  documentUrl: string;
  validFrom?: string;
  validTo?: string;
};

export default function PublishedDocumentsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [pagedRows, setPagedRows] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const filterModelRef = useRef<any>({});
  const sortModelRef = useRef<any[]>([]);
  const filterDebounceRef = useRef<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const gridShellRef = useRef<HTMLDivElement | null>(null);
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  const [folderMap, setFolderMap] = useState<Record<number, string>>({});

  // Format ISO datetime to DD-MM-YYYY only
  const toDateOnly = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const columnDefs = useMemo<ColDef<DocumentRow>[]>(() => [
    // Put Document Name first for easier scanning and consistent UX
    { field: 'documentName', headerName: 'Document Name', minWidth: 240, flex: 1.8, filter: 'agTextColumnFilter', sortable: true, cellRenderer: (p: { value: string; data: DocumentRow }) => <Link className="text-blue-600 hover:underline" href={`/admin/published-documents/documents/${p.data.id}/edit`}>{p.value}</Link> },
    { field: 'folderName', headerName: 'Documents Folder', minWidth: 200, flex: 1.2, filter: 'agTextColumnFilter', sortable: true },
    { field: 'documentUrl', headerName: 'Document URL', minWidth: 240, flex: 1.4, filter: 'agTextColumnFilter', sortable: true },
    { field: 'validFrom', headerName: 'Valid From', width: 140, filter: 'agDateColumnFilter', sortable: true, valueFormatter: (p: any) => toDateOnly(p.value) },
    { field: 'validTo', headerName: 'Valid To', width: 140, filter: 'agDateColumnFilter', sortable: true, valueFormatter: (p: any) => toDateOnly(p.value) },
  ], [showFilters]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const fetchPage = async () => {
    if (gridShellRef.current) {
      const h = gridShellRef.current.offsetHeight;
      if (h > 0) setFrozenHeight(h);
    }
    setLoading(true);
    try {
      // Keep $select limited to fields guaranteed by backend; folder name isn't provided in OData currently
      const select = "$select=Id,PublishedDocumentFolderId,DocumentName,DocumentUrl,ValidFrom,ValidTo";
      const filter = query.trim() ? `&$filter=contains(DocumentName,'${encodeURIComponent(query.trim()).replace(/'/g, "''")}')` : "";
      const orderBy = "&$orderby=DocumentName asc";

      const [docsRes, foldersRes] = await Promise.all([
        fetchPublishedDocumentsODataAction({ query: `?${select}${filter}&$count=true${orderBy}` }),
        fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' })
      ]);

      let localFolderMap: Record<number, string> = { ...folderMap };
      if (foldersRes.status === 200 && foldersRes.data) {
        localFolderMap = {};
        for (const f of foldersRes.data.rows) localFolderMap[f.id] = f.name;
        setFolderMap(localFolderMap);
      }

      if (docsRes.status === 200 && docsRes.data) {
        const mapped: DocumentRow[] = docsRes.data.rows.map((r) => ({
          id: r.id,
          folderName: localFolderMap[r.publishedDocumentFolderId] || r.folderName || String(r.publishedDocumentFolderId),
          documentName: r.documentName,
          documentUrl: r.documentUrl,
          validFrom: r.validFrom,
          validTo: r.validTo,
        }));
        setRows(mapped);
        setTotal(docsRes.data.total);
      } else {
        setToast({ message: docsRes.message || 'Failed to fetch', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startIndex = (page - 1) * pageSize;
    setPagedRows(rows.slice(startIndex, startIndex + pageSize));
  }, [rows, page, pageSize]);

  useEffect(() => { fetchPage(); }, [query]);

  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
        <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600" />} title="Published Documents" showSearch searchValue={query} onSearch={(v) => { setPage(1); setQuery(v); }} />
      </div>
      <div className="bg-white shadow rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/published-documents/documents/new"><button className="inline-flex items-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4" /> New</button></Link>
            <button disabled={deleting || selectedCount === 0} onClick={() => {
              const sel = gridApiRef.current?.getSelectedRows?.() as DocumentRow[];
              if (!sel?.length) { setToast({ message: 'Select rows to delete', type: 'info' }); return; }
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
          <AgGridReact<DocumentRow>
            columnDefs={columnDefs}
            selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', suppressMovable: true, resizable: false }}
            defaultColDef={defaultColDef}
            rowData={pagedRows}
            getRowId={(p) => String(p.data.id)}
            onGridReady={(e) => { gridApiRef.current = e.api; }}
            rowSelection={{ mode: 'multiRow' }}
            onSelectionChanged={() => setSelectedCount(gridApiRef.current?.getSelectedRows()?.length || 0)}
            headerHeight={36} rowHeight={32}
            theme="legacy"
            animateRows
          />
          {loading && (
            <GridOverlayLoader message="Loading documents..." backdropClassName="bg-white/70 backdrop-blur-sm" />
          )}
        </div>
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
      <ConfirmationModal isOpen={confirmOpen} title="Confirm Delete" message={`Delete ${selectedCount} selected document(s)?`} cancelText="Cancel" variant="danger" confirmText={deleting ? 'Deleting…' : 'Delete'} onCancel={() => setConfirmOpen(false)} onConfirm={async () => {
        setDeleting(true);
        try {
          const sel = gridApiRef.current?.getSelectedRows?.() as DocumentRow[];
          if (sel?.length) {
            for (const row of sel) {
              await deletePublishedDocumentAction(row.id);
            }
            await fetchPage();
          }
        } finally {
          setDeleting(false); setConfirmOpen(false);
        }
      }} />
    </div>
  );
}
