"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { BookOpenText, PlusCircle, Trash2, Filter, XCircle } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent, SortModelItem } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { fetchTestInstructionsAction, deleteTestInstructionAction, type TestInstructionRow } from "@/app/actions/admin/testInstructions";
import { stripHtmlTags } from "@/utils/stripHtmlTags";
import PaginationControls from "@/components/PaginationControls";
import Loader from "@/components/Loader";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";

ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: TestInstructionRow }) {
  return <Link href={`/admin/test-instructions/${props.data.id}/edit`} className="text-blue-600 hover:underline" title={props.value}>{props.value}</Link>;
}

function StatusCell(props: { value: number }) {
  const active = Number(props.value) === 1;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

function formatDate(v?: string) {
  if (!v) return '';
  const d = new Date(v); if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function TestInstructionsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<TestInstructionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TestInstructionRow[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const gridApiRef = useRef<GridApi|null>(null);
  const sortModelRef = useRef<SortModelItem[]|undefined>(undefined);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const skipNextFilterFetchRef = useRef(false);
  const lastReqRef = useRef(0);

  const columnDefs = useMemo<ColDef<TestInstructionRow>[]>(() => [
    { headerName: 'S.No.', valueGetter: (p:any) => (p?.node?.rowIndex ?? 0)+1 + (page-1)*pageSize, width: 90, pinned: 'left', sortable: false, filter: false, resizable:false, cellClass:'no-right-border', headerClass:'no-right-border' },
    { field: 'name', headerName: 'Name', width: 300, cellRenderer: NameCellRenderer, filter: 'agTextColumnFilter', sortable: true, tooltipField: 'name', cellClass:'no-left-border', headerClass:'no-left-border' },
    { field: 'instruction', headerName: 'Instruction', flex: 1, minWidth: 340, filter: 'agTextColumnFilter', sortable: true, valueFormatter: p => {
        const txt = stripHtmlTags(p.value || '').trim();
        if(!txt) return '';
        return txt.length > 140 ? txt.slice(0,137)+'…' : txt;
      }, tooltipValueGetter: p => stripHtmlTags(p.data?.instruction||'') },
    { field: 'language', headerName: 'Language', width: 160, filter: 'agTextColumnFilter', sortable: true },
    { field: 'isActive', headerName: 'Status', width: 120, filter: 'agTextColumnFilter', sortable: true, cellRenderer: StatusCell },
    { field: 'createdBy', headerName: 'Created By', width: 160, filter: 'agTextColumnFilter', sortable: true },
    { field: 'createdDate', headerName: 'Created Date', width: 160, sortable: true, valueFormatter: p=>formatDate(p.value) },
    { field: 'modifiedDate', headerName: 'Updated Date', width: 160, sortable: true, valueFormatter: p=>formatDate(p.value) },
    { field: 'id', hide: true }
  ], [page, pageSize, showFilters]);

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: showFilters }), [showFilters]);

  const onGridReady = useCallback((e: GridReadyEvent) => { gridApiRef.current = e.api; }, []);

  const fetchPage = useCallback(async () => {
    const reqId = ++lastReqRef.current;
    setLoading(true);
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string,string> = { name:'TestInstructionName', instruction:'TestInstruction1', language:'Language', isActive:'IsActive', createdDate:'CreatedDate', modifiedDate:'ModifiedDate', createdBy:'CreatedBy' };
    const orderBy = sort ? `${fieldMap[sort.colId] ?? 'CreatedDate'} ${sort.sort}` : 'CreatedDate desc';
    const filters: string[] = [];
    const search = query.trim();
    if (search) filters.push(`contains(TestInstructionName,'${search.replace(/'/g,"''")}')`);
    const fm = filterModelRef.current || {};
    const textExpr = (field: string, m:any) => { if(!m) return null; const val = (m.filter ?? '').toString().trim(); if(!val) return null; const safe = val.replace(/'/g,"''"); return `contains(${field},'${safe}')`; };
    if (fm.name) { const t = textExpr('TestInstructionName', fm.name); if (t) filters.push(t); }
    if (fm.instruction) { const t = textExpr('TestInstruction1', fm.instruction); if (t) filters.push(t); }
    if (fm.language) { const t = textExpr('Language', fm.language); if (t) filters.push(t); }
    if (fm.createdBy) { const t = textExpr('CreatedBy', fm.createdBy); if (t) filters.push(t); }
    if (fm.isActive) { const raw = (fm.isActive.filter ?? '').toString().toLowerCase(); if(['1','true','active','yes'].includes(raw)) filters.push('IsActive eq 1'); else if(['0','false','inactive','no'].includes(raw)) filters.push('IsActive eq 0'); }
    const filter = filters.length ? Array.from(new Set(filters)).join(' and ') : undefined;
    const res = await fetchTestInstructionsAction({ top: pageSize, skip: (page-1)*pageSize, orderBy, filter });
    if (reqId === lastReqRef.current) {
  if (res.status === 200 && res.data) { setRows(res.data.rows.slice()); setTotal(res.data.total); setSelectedRows([]); setSelectedCount(0); }
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(()=>{ fetchPage(); }, [fetchPage]);

  const onSortChanged = useCallback(()=>{ sortModelRef.current = (gridApiRef.current as any)?.getSortModel?.(); setPage(1); }, []);

  return <div className="p-4 bg-gray-50 h-full flex flex-col">
    <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
      <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600" />} title="Test Instructions" showSearch searchValue={query} onSearch={v=>setQuery(v)} />
    </div>
  <div className="bg-white shadow rounded-lg p-2 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 flex-none">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/test-instructions/new"><button className="inline-flex items-center gap-2 w-40 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"><PlusCircle className="w-4 h-4"/> New</button></Link>
          <button disabled={selectedCount===0 || deleting} onClick={()=>{ if(selectedCount===0){ setToast({ message:'Select records to delete', type:'info'}); return;} setConfirmOpen(true); }} className="inline-flex items-center gap-2 w-40 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"><Trash2 className="w-4 h-4"/> {deleting? 'Deleting...':'Delete'}{selectedCount>0 && !deleting && <span className="ml-1">({selectedCount})</span>}</button>
        </div>
        <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s=>{ setPageSize(s); setPage(1); }} pageSizeOptions={[15,25,50,100]} showTotalCount />
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={showFilters} onClick={()=>setShowFilters(v=>!v)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${showFilters? 'bg-blue-50 text-blue-700 border-blue-200':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><Filter className="w-4 h-4"/> {showFilters? 'Hide Filters':'Show Filters'}</button>
          <button onClick={()=>{ const api = gridApiRef.current as any; const hasSearch = !!query; filterModelRef.current = {}; if (hasSearch) skipNextFilterFetchRef.current = true; api?.setFilterModel?.(null); setPage(1); if(hasSearch) setQuery(''); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={!query && Object.keys(filterModelRef.current||{}).length===0}><XCircle className="w-4 h-4"/> Clear Filters</button>
        </div>
      </div>
      {(query || Object.keys(filterModelRef.current||{}).length>0) && <div className="mb-3 flex items-center flex-wrap gap-2 flex-none">
        <span className="text-xs text-gray-500">Active filters:</span>
        {query && <button onClick={()=>setQuery('')} className="text-xs inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 hover:bg-blue-100">Search: '{query}' <span className="text-blue-500">✕</span></button>}
        {Object.entries(filterModelRef.current).map(([key]) => <button key={key} onClick={()=>{ const api = gridApiRef.current as any; const fm={...(filterModelRef.current||{})}; delete fm[key]; filterModelRef.current=fm; api?.setFilterModel?.(fm); setPage(1); }} className="text-xs inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 px-3 py-1 hover:bg-gray-200">{key}<span className="text-gray-500">✕</span></button>)}
        <button onClick={()=>{ const api = gridApiRef.current as any; const hasSearch = !!query; filterModelRef.current={}; if(hasSearch) skipNextFilterFetchRef.current=true; api?.setFilterModel?.(null); setPage(1); if(hasSearch) setQuery(''); }} className="text-xs inline-flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 px-3 py-1 hover:bg-gray-50">Clear all</button>
      </div>}
      <div className="flex-1 min-h-0 ag-theme-alpine ag-theme-evalus flex flex-col">
        {loading ? <Loader/> : <div className="h-full min-h-0 flex flex-col">
          <AgGridReact<TestInstructionRow>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={rows}
            onGridReady={onGridReady}
            onSortChanged={onSortChanged}
            onSelectionChanged={()=>{ const api = gridApiRef.current as any; const sel = (api?.getSelectedRows?.() as TestInstructionRow[])||[]; setSelectedRows(sel); setSelectedCount(sel.length); }}
            onFilterChanged={()=>{ const fm = (gridApiRef.current as any)?.getFilterModel?.(); filterModelRef.current = fm || {}; if(skipNextFilterFetchRef.current){ skipNextFilterFetchRef.current=false; return;} if(filterDebounceRef.current) clearTimeout(filterDebounceRef.current); filterDebounceRef.current=setTimeout(()=>{ if(page===1) fetchPage(); else setPage(1); },300); }}
            rowSelection={{ mode:'multiRow', checkboxes:true, enableClickSelection:true }}
            selectionColumnDef={{ pinned:'left', width:44, headerName:'', resizable:false, cellClass:'no-right-border', headerClass:'no-right-border', suppressMovable:true }}
            animateRows headerHeight={36} rowHeight={32} tooltipShowDelay={300} theme="legacy"
          />
        </div>}
      </div>
      <style jsx global>{`
        .ag-theme-alpine.ag-theme-evalus .ag-cell.no-right-border, .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border{border-right:none!important;}
        .ag-theme-alpine.ag-theme-evalus .ag-center-cols-container .ag-row .ag-cell.no-left-border, .ag-theme-alpine.ag-theme-evalus .ag-header-row .ag-header-cell.no-left-border{border-left:none!important;}
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border .ag-header-cell-resize, .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-left-border .ag-header-cell-resize{display:none!important;}
      `}</style>
  <ConfirmationModal isOpen={confirmOpen} title="Confirm Delete" variant="danger" confirmText={deleting? 'Deleting...':'Delete'} cancelText="Cancel" message={selectedCount>0? (selectedCount===1?`Delete instruction \"${selectedRows[0].name}\"? This cannot be undone.`:`Delete ${selectedCount} instructions? This cannot be undone.`):''} onCancel={()=>{ setConfirmOpen(false); }} onConfirm={async()=>{ if(selectedCount===0) return; setDeleting(true); try { const promises = selectedRows.map(r=>deleteTestInstructionAction(r.id)); const results = await Promise.all(promises); const failed = results.filter(r=>r.status!==200); if(failed.length===0){ setToast({ message: selectedCount===1? 'Deleted successfully':'Deleted selected instructions', type:'success'}); } else { setToast({ message: failed.length+ ' deletions failed', type:'error'}); } } finally { setDeleting(false); setConfirmOpen(false); fetchPage(); } }} />
    </div>
    <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>
  </div>;
}
