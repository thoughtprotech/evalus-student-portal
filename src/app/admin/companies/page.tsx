"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { Filter, XCircle } from "lucide-react";
import { fetchCompaniesAction, deleteCompanyAction, type CompanyRow } from "@/app/actions/admin/companies";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Trash2, PlusCircle } from "lucide-react";
import Loader from "@/components/Loader";
import Toast from "@/components/Toast";
import PaginationControls from "@/components/PaginationControls";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent, SortModelItem } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// AG Grid v31+ uses modules; register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

function CompanyNameCellRenderer(props: { value: string; data: CompanyRow }) {
  return (
    <Link
      className="text-blue-600 hover:underline"
      href={`/admin/companies/${props.data.id}`}
      title={props.value}
    >
      {props.value}
    </Link>
  );
}

function ContactCellRenderer(props: { data: CompanyRow }) {
  const fullName = `${props.data.firstName} ${props.data.lastName}`.trim();
  return (
    <div className="flex flex-col">
      <span className="font-medium">{fullName}</span>
      <span className="text-xs text-gray-500">{props.data.email}</span>
    </div>
  );
}

function LocationCellRenderer(props: { data: CompanyRow }) {
  const location = [props.data.city, props.data.state, props.data.country].filter(Boolean).join(", ");
  return (
    <span className="text-sm" title={`${props.data.address}, ${location}`}>
      {location || "N/A"}
    </span>
  );
}

function PhoneCellRenderer(props: { data: CompanyRow }) {
  return (
    <div className="flex flex-col text-xs">
      {props.data.phoneNumber && <span>📞 {props.data.phoneNumber}</span>}
      {props.data.cellPhone && <span>📱 {props.data.cellPhone}</span>}
    </div>
  );
}

function IsActiveCellRenderer(props: { value: number | boolean }) {
  const isActive = Boolean(props.value);
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// Local date formatter: expects ISO or YYYY-MM-DD, outputs dd/mm/yyyy
function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
}

function CompaniesGrid({ query, onClearQuery }: { query: string; onClearQuery?: () => void }) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CompanyRow[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const sortModelRef = useRef<SortModelItem[] | undefined>(undefined);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const lastReqIdRef = useRef(0);
  const skipNextFilterFetchRef = useRef(false);

  const columnDefs = useMemo<ColDef<CompanyRow>[]>(
    () => [
      { 
        headerName: "Company Id", 
        valueGetter: (p: any) => {
          const idx = (p?.node?.rowIndex ?? 0) as number;
          return idx + 1 + (page - 1) * pageSize;
        }, 
        width: 120, 
        pinned: 'left', 
        sortable: false, 
        filter: false, 
        resizable: false, 
        cellClass: 'no-right-border', 
        headerClass: 'no-right-border' 
      },
      { 
        field: "companyName", 
        headerName: "Company Name", 
        headerTooltip: "Company Name", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200,
          suppressAndOrCondition: false
        }, 
        width: 250, 
        cellRenderer: CompanyNameCellRenderer, 
        tooltipField: "companyName", 
        cellClass: 'no-left-border', 
        headerClass: 'no-left-border' 
      },
      { 
        headerName: "First Name", 
        headerTooltip: "Contact Person First Name", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 200,
        cellRenderer: ContactCellRenderer,
        valueGetter: (params: any) => {
          // For filtering purposes, combine first name, last name, and email
          const { firstName, lastName, email } = params.data || {};
          return `${firstName || ''} ${lastName || ''} ${email || ''}`.trim();
        }
      },
      { 
        field: "phoneNumber", 
        headerName: "Phone Number", 
        headerTooltip: "Phone Numbers", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 150,
        cellRenderer: PhoneCellRenderer,
        valueGetter: (params: any) => {
          // For filtering, combine both phone numbers
          const { phoneNumber, cellPhone } = params.data || {};
          return `${phoneNumber || ''} ${cellPhone || ''}`.trim();
        }
      },
      { 
        headerName: "Address", 
          headerTooltip: "Address", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 180,
        cellRenderer: LocationCellRenderer,
        valueGetter: (params: any) => {
          // For filtering purposes, combine location fields
          const { city, state, country } = params.data || {};
          return [city, state, country].filter(Boolean).join(" ");
        }
      },
      { 
        field: "email", 
        headerName: "Email", 
        headerTooltip: "Email", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 200 
      },
      { 
        field: "isActive", 
        headerName: "Status", 
        headerTooltip: "Active Status", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        valueGetter: (params: any) => {
          const isActive = Boolean(params.data?.isActive);
          return isActive ? 'Active' : 'Inactive';
        },
        cellRenderer: IsActiveCellRenderer, 
        width: 125 
      },
          {
        field: "createdAt", 
        headerName: "Created Date", 
        headerTooltip: "Company Created Date", 
        sortable: true, 
        filter: 'agDateColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'], 
          browserDatePicker: true,
          debounceMs: 200
        }, 
        valueFormatter: ({ value }) => formatDate(value), 
        width: 140 
          },
          {
              field: "createdBy",
              headerName: "Created By",
              headerTooltip: "Created By",
              sortable: true,
              filter: 'agTextColumnFilter',
              filterParams: {
                  buttons: ['apply', 'reset', 'clear'],
                  debounceMs: 200
              },
              minWidth: 120,
              flex: 1
          },
      { 
        field: "updatedAt", 
        headerName: "Modified Date", 
        headerTooltip: "Company Modified Date", 
        sortable: true, 
        filter: 'agDateColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'], 
          browserDatePicker: true,
          debounceMs: 200
        }, 
        valueFormatter: ({ value }) => formatDate(value), 
        width: 140 
      },
          {
              field: "modifiedBy",
              headerName: "Modified By",
              headerTooltip: "Modified By",
              sortable: true,
              filter: 'agTextColumnFilter',
              filterParams: {
                  buttons: ['apply', 'reset', 'clear'],
                  debounceMs: 200
              },
              minWidth: 140,
              flex: 1
          },
      {
        headerName: "Actions",
        cellRenderer: (props: { data: CompanyRow }) => (
          <div className="flex items-center gap-2 h-full">
            <Link href={`/admin/companies/${props.data.id}/edit`}>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Edit company"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </Link>
          </div>
        ),
        width: 80,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: 'right'
      },
      { field: "id", headerName: "ID", hide: true },
    ],
    [page, pageSize]
  );

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: showFilters,
  }), [showFilters]);

  const onGridReady = useCallback((e: GridReadyEvent) => {
    gridApiRef.current = e.api;
  }, []);

  const fetchPage = useCallback(async () => {
    const reqId = ++lastReqIdRef.current;
    setLoading(true);
    
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string, string> = {
      id: "companyId",
      companyName: "companyName",
      firstName: "firstName",
      lastName: "lastName",
      email: "email",
      phoneNumber: "phoneNumber",
      cellPhone: "cellPhone",
      city: "city",
      state: "state",
      country: "country",
      isActive: "isActive",
      createdAt: "createdDate",
      updatedAt: "modifiedDate",
      createdBy: "createdBy",
       modifiedBy: "modifiedBy",
    };
    const orderBy = sort ? `${fieldMap[sort.colId] ?? "companyId"} ${sort.sort}` : "companyId desc";
    
    // Build filter from both global search and column filters
    const filters: string[] = [];
    const search = (query ?? "").trim();
    if (search) filters.push(`contains(companyName,'${search.replace(/'/g, "''")}')`);
    
    const filterModel = filterModelRef.current || {};
    Object.entries(filterModel).forEach(([field, filterConfig]: [string, any]) => {
      if (!filterConfig) return;
      
      const serverField = fieldMap[field] || field;
      
      if (filterConfig.filterType === 'text' && filterConfig.filter) {
        const value = filterConfig.filter.replace(/'/g, "''");
        
        if (field === 'isActive') {
          const lowerValue = value.toLowerCase();
          if (lowerValue === 'active' || lowerValue === '1' || lowerValue === 'true') {
            filters.push(`${serverField} eq 1`);
          } else if (lowerValue === 'inactive' || lowerValue === '0' || lowerValue === 'false') {
            filters.push(`${serverField} eq 0`);
          }
          return;
        }
        
        switch (filterConfig.type) {
          case 'contains':
            filters.push(`contains(${serverField},'${value}')`);
            break;
          case 'startsWith':
            filters.push(`startswith(${serverField},'${value}')`);
            break;
          case 'endsWith':
            filters.push(`endswith(${serverField},'${value}')`);
            break;
          case 'equals':
            filters.push(`${serverField} eq '${value}'`);
            break;
        }
      } else if (filterConfig.filter !== undefined) {
        const value = String(filterConfig.filter).replace(/'/g, "''");
        
        if (field === 'isActive') {
          const lowerValue = value.toLowerCase();
          if (lowerValue === 'active' || lowerValue === '1' || lowerValue === 'true') {
            filters.push(`${serverField} eq 1`);
          } else if (lowerValue === 'inactive' || lowerValue === '0' || lowerValue === 'false') {
            filters.push(`${serverField} eq 0`);
          }
          return;
        }
        
        filters.push(`contains(${serverField},'${value}')`);
      }
    });
    
    const filter = filters.length ? Array.from(new Set(filters)).join(" and ") : undefined;

    const res = await fetchCompaniesAction({ top: pageSize, skip: (page - 1) * pageSize, orderBy, filter });
    
    if (reqId === lastReqIdRef.current) {
      if (res.status === 200 && res.data) {
        setRows(res.data.rows.slice());
        setTotal(res.data.total);
      } else {
        setToast({ message: res.message || "Failed to fetch companies", type: "error" });
      }
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const onSortChanged = useCallback(() => {
    const model = (gridApiRef.current as any)?.getSortModel?.() as SortModelItem[] | undefined;
    sortModelRef.current = model;
    setPage(1);
  }, []);

  return (
    <div className="ag-theme-alpine ag-theme-evalus flex flex-col h-full min-h-0" style={{ width: "100%", height: "100%" }}>
      <div className="mb-3 flex items-center justify-between gap-3 flex-none">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/companies/new">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
              title="Create new company"
            >
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </Link>
          <button
            type="button"
            onClick={() => {
              const api = gridApiRef.current;
              if (!api) return;
              const selected = api.getSelectedRows?.() as CompanyRow[];
              if (!selected || selected.length === 0) {
                setToast({ message: "Please select at least one company to delete.", type: "info" });
                return;
              }
              setPendingDelete(selected);
              setConfirmOpen(true);
            }}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"
            title="Delete selected companies"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
          {selectedCount > 0 && (
            <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
              {selectedCount} selected
            </span>
          )}
        </div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
          pageSizeOptions={[15, 25, 50]}
          showTotalCount
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className={
              `inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ` +
              (showFilters
                ? `bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`
                : `bg-white text-gray-700 border-gray-300 hover:bg-gray-50`)
            }
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={() => {
              const api = gridApiRef.current as any;
              const hasSearch = !!(query && query.length);
              filterModelRef.current = {};
              if (hasSearch && onClearQuery) {
                skipNextFilterFetchRef.current = true;
              }
              api?.setFilterModel?.(null);
              setFiltersVersion((v) => v + 1);
              setPage(1);
              if (hasSearch && onClearQuery) {
                onClearQuery();
              }
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
          {query ? (
            <button
              onClick={() => onClearQuery?.()}
              className="text-xs inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 hover:bg-blue-100"
              title="Clear search"
            >
              Search: '{query}' <span className="text-blue-500">✕</span>
            </button>
          ) : null}
          {Object.entries(filterModelRef.current as Record<string, any>).map(([key, m]) => {
            const nameMap: Record<string,string> = {
              id: 'ID', companyName: 'Company Name', email: 'Email', phoneNumber: 'Phone',
              isActive: 'Status', createdAt: 'Created Date', updatedAt: 'Updated Date', createdBy: 'Created By'
            };
            const labelBase = nameMap[key] || key;
            const shortLabel = (() => {
              const getCond = (mm: any) => (mm?.operator ? mm?.condition1 : mm) || mm;
              const c = getCond(m);
              if (!c) return `${labelBase}`;
              const t = c.type || c.filterType || 'contains';
              const isDateKey = key === 'createdAt' || key === 'updatedAt';
              const val = c.filter ?? c.dateFrom ?? '';
              
              if (isDateKey) {
                if (t === 'inRange') return `${labelBase}: ${formatDate(c.dateFrom)} → ${formatDate(c.dateTo)}`;
                if (val) return `${labelBase}: ${formatDate(val)}`;
                return `${labelBase}`;
              }
              if (t === 'inRange') return `${labelBase}: ${c.dateFrom ?? c.filter} → ${c.dateTo ?? c.filterTo}`;
              if (val) return `${labelBase}: ${t} '${val}'`;
              return `${labelBase}`;
            })();
            return (
              <button
                key={key}
                onClick={() => {
                  const api = gridApiRef.current as any;
                  const fm = { ...(filterModelRef.current || {}) };
                  delete fm[key];
                  filterModelRef.current = fm;
                  api?.setFilterModel?.(fm);
                  setFiltersVersion((v) => v + 1);
                  setPage(1);
                }}
                className="text-xs inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 px-3 py-1 hover:bg-gray-200"
                title="Remove this filter"
              >
                {shortLabel}
                <span className="text-gray-500">✕</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              const api = gridApiRef.current as any;
              const hasSearch = !!(query && query.length);
              filterModelRef.current = {};
              if (hasSearch && onClearQuery) {
                skipNextFilterFetchRef.current = true;
              }
              api?.setFilterModel?.(null);
              setFiltersVersion((v) => v + 1);
              setPage(1);
              if (hasSearch && onClearQuery) {
                onClearQuery();
              }
            }}
            className="text-xs inline-flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 px-3 py-1 hover:bg-gray-50"
            title="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <div className="bg-white shadow rounded-md border border-gray-300 p-8 h-full overflow-auto">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-500 mb-4">
              No companies found. Try adjusting your search criteria or add new companies.
            </p>
            <Link href="/admin/companies/new">
              <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors duration-300">
                Add New Company
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="h-full min-h-0">
        <AgGridReact<CompanyRow>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={rows}
          onGridReady={onGridReady}
          onSortChanged={onSortChanged}
          onFilterChanged={() => {
            const api = gridApiRef.current as any;
            if (!api) return;
            
            const fm = api.getFilterModel?.() as any;
            filterModelRef.current = fm || {};
            setFiltersVersion((v) => v + 1);
            
            if (filterDebounceRef.current) {
              clearTimeout(filterDebounceRef.current);
            }
            
            filterDebounceRef.current = setTimeout(() => {
              if (!skipNextFilterFetchRef.current) {
                setPage(1);
              }
              skipNextFilterFetchRef.current = false;
            }, 300);
          }}
          onSelectionChanged={() => {
            const api = gridApiRef.current;
            if (!api) return;
            const selected = api.getSelectedRows?.() as CompanyRow[];
            setSelectedCount(selected?.length || 0);
          }}
      pagination={false}
          rowSelection={{ mode: 'multiRow', checkboxes: true }}
          selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', resizable: false, cellClass: 'no-right-border', headerClass: 'no-right-border', suppressMovable: true }}
          animateRows
          headerHeight={36}
          rowHeight={48}
          tooltipShowDelay={300}
          suppressMenuHide={false}
          suppressRowDeselection={true}
          stopEditingWhenCellsLoseFocus={true}
          theme="legacy"
        />
        </div>
    )}
    </div>
      
      <style jsx global>{`
        .ag-theme-alpine.ag-theme-evalus .ag-cell.no-right-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border {
          border-right: none !important;
        }
        .ag-theme-alpine.ag-theme-evalus .ag-center-cols-container .ag-row .ag-cell.no-left-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-row .ag-header-cell.no-left-border {
          border-left: none !important;
        }
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border .ag-header-cell-resize,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-left-border .ag-header-cell-resize {
          display: none !important;
        }
      `}</style>
      
      <ConfirmationModal
        title="Confirm Delete"
        message={pendingDelete.length > 0 
          ? pendingDelete.length === 1 
            ? `Are you sure you want to delete "${pendingDelete[0].companyName}"? This action cannot be undone.`
            : `Are you sure you want to delete ${pendingDelete.length} companies? This action cannot be undone.`
          : ""
        }
        isOpen={confirmOpen}
        variant="danger"
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setPendingDelete([]); }}
        onConfirm={async () => {
          if (pendingDelete.length === 0) return;
          setDeleting(true);
          
          try {
            const deletePromises = pendingDelete.map(company => deleteCompanyAction(company.id));
            const results = await Promise.all(deletePromises);
            
            const failedDeletes = results.filter(res => res.status !== 200);
            
            if (failedDeletes.length === 0) {
              setToast({ 
                message: pendingDelete.length === 1 
                  ? "Company deleted successfully." 
                  : `${pendingDelete.length} companies deleted successfully.`, 
                type: "success" 
              });
            } else {
              setToast({ 
                message: `${failedDeletes.length} companies failed to delete.`, 
                type: "error" 
              });
            }
            
            fetchPage();
          } catch (error) {
            setToast({ message: "Delete operation failed", type: "error" });
          }
          
          setDeleting(false);
          setConfirmOpen(false);
          setPendingDelete([]);
        }}
      />
      
  <div className="fixed top-4 right-4 z-50 space-y-2">
        {toast ? (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            durationMs={3000}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("admin-companies-search") ?? "";
    if (saved) setQuery(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("admin-companies-search", query);
  }, [query]);

  return (
    <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
        <PageHeader
          icon={<Building2 className="w-6 h-6 text-indigo-600" />}
          title="Companies"
          showSearch
          searchValue={query}
          onSearch={(e) => setQuery(e)}
        />
      </div>

      <div className="bg-white shadow rounded-lg p-2 flex-1 min-h-0 overflow-hidden">
        <CompaniesGrid query={query} onClearQuery={() => setQuery("")} />
      </div>
    </div>
  );
}