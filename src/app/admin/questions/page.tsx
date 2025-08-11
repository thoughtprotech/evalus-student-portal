"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Filter, XCircle } from "lucide-react";
import { fetchQuestionsAction, deleteQuestionAction, type QuestionRow } from "@/app/actions/admin/questions";
import PageHeader from "@/components/PageHeader";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Trash2, PlusCircle } from "lucide-react";
import Loader from "@/components/Loader";
import Toast from "@/components/Toast";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent, SortModelItem } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// AG Grid v31+ uses modules; register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: QuestionRow }) {
  return (
    <Link
      className="text-blue-600 hover:underline"
      href={`/admin/questions/${props.data.id}`}
      title={props.value}
    >
      {props.value}
    </Link>
  );
}

function LevelCellRenderer(props: { value: string }) {
  const getColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(props.value)}`}>
      {props.value}
    </span>
  );
}

function LanguageCellRenderer(props: { value: string }) {
  return (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
      {props.value || 'EN'}
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

function QuestionsGrid({ query, onClearQuery }: { query: string; onClearQuery?: () => void }) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QuestionRow[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const sortModelRef = useRef<SortModelItem[] | undefined>(undefined);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const [filtersVersion, setFiltersVersion] = useState(0); // trigger re-render when filter model changes
  const lastReqIdRef = useRef(0); // sequence requests to avoid stale overwrites
  const skipNextFilterFetchRef = useRef(false); // coordinate double fetch when also clearing search

  const columnDefs = useMemo<ColDef<QuestionRow>[]>(
    () => [
      // Checkbox selection column will be injected automatically and shown first when rowSelection.checkboxes = true
      { 
        headerName: "S.No.", 
        valueGetter: (p: any) => {
          // For client-side pagination, use the row index directly
          const idx = (p?.node?.rowIndex ?? 0) as number;
          return idx + 1;
        }, 
        width: 90, 
        pinned: 'left', 
        sortable: false, 
        filter: false, 
        resizable: false, 
        cellClass: 'no-right-border', 
        headerClass: 'no-right-border' 
      },
      { 
        field: "title", 
        headerName: "Question Title", 
        headerTooltip: "Question Title", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200,
          suppressAndOrCondition: false
        }, 
        width: 300, 
        cellRenderer: NameCellRenderer, 
        tooltipField: "title", 
        cellClass: 'no-left-border', 
        headerClass: 'no-left-border' 
      },
      { 
        field: "subject", 
        headerName: "Subject", 
        headerTooltip: "Subject", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 150 
      },
      { 
        field: "topic", 
        headerName: "Topic", 
        headerTooltip: "Topic", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        width: 150 
      },
      { 
        field: "level", 
        headerName: "Level", 
        headerTooltip: "Difficulty Level", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        cellRenderer: LevelCellRenderer, 
        width: 130 
      },
      { 
        field: "language", 
        headerName: "Language", 
        headerTooltip: "Language", 
        sortable: true, 
        filter: 'agTextColumnFilter', 
        filterParams: { 
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        cellRenderer: LanguageCellRenderer, 
        width: 120 
      },
      { 
        field: "createdAt", 
        headerName: "Created Date", 
        headerTooltip: "Question Created Date", 
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
        field: "updatedAt", 
        headerName: "Updated Date", 
        headerTooltip: "Question Updated Date", 
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
          buttons: ['apply','reset','clear'],
          debounceMs: 200
        }, 
        minWidth: 150, 
        flex: 1 
      },
      {
        headerName: "Actions",
        cellRenderer: (props: { data: QuestionRow }) => (
          <div className="flex items-center gap-2 h-full">
            <Link href={`/admin/questions/${props.data.id}/edit`}>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Edit question"
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
    [] // No dependencies needed for client-side operations
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

  // Fetch data whenever dependencies change
  const fetchPage = useCallback(async () => {
    const reqId = ++lastReqIdRef.current;
    setLoading(true);
    
    console.log('Fetching all questions for client-side operations');
    
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string, string> = {
      id: "questionId",
      title: "questionText",
      subject: "subject",
      topic: "topic",
      level: "questionDifficultyLevel",
      language: "language",
      createdAt: "createdDate",
      updatedAt: "modifiedDate",
      createdBy: "createdBy",
    };
    const orderBy = sort ? `${fieldMap[sort.colId] ?? "questionId"} ${sort.sort}` : "questionId desc";
    
    // Only apply global search filter, let AG Grid handle column filters client-side
    const filters: string[] = [];
    const search = (query ?? "").trim();
    if (search) filters.push(`contains(questionText,'${search.replace(/'/g, "''")}')`);
    
    const filter = filters.length ? Array.from(new Set(filters)).join(" and ") : undefined;

    // Load all data for client-side operations (or a reasonable large subset)
    console.log('Making API call with params:', { top: 1000, skip: 0, orderBy, filter });

    const res = await fetchQuestionsAction({ top: 1000, skip: 0, orderBy, filter });
    
    console.log('API response:', res);
    
    // Only apply if this is the latest request
    if (reqId === lastReqIdRef.current) {
      if (res.status === 200 && res.data) {
        console.log('Setting rows for client-side operations:', res.data.rows.length);
        setRows(res.data.rows.slice());
        setTotal(res.data.total);
      } else {
        console.error('API call failed:', res);
        setToast({ message: res.message || "Failed to fetch questions", type: "error" });
      }
      setLoading(false);
    }
  }, [query]); // Removed page and pageSize from dependencies since we're doing client-side pagination

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const onSortChanged = useCallback(() => {
    const model = (gridApiRef.current as any)?.getSortModel?.() as SortModelItem[] | undefined;
    sortModelRef.current = model;
    console.log('Sort changed - client-side sorting applied:', model);
    // No need to reset page or fetch data for client-side sorting
  }, []);

  return (
    <div className="ag-theme-alpine ag-theme-evalus" style={{ width: "100%" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Actions: New and Delete */}
          <Link href="/admin/questions/new">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
              title="Create new question"
            >
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </Link>
          <button
            type="button"
            onClick={() => {
              const api = gridApiRef.current;
              if (!api) return;
              const selected = api.getSelectedRows?.() as QuestionRow[];
              if (!selected || selected.length === 0) {
                setToast({ message: "Please select at least one question to delete.", type: "info" });
                return;
              }
              setPendingDelete(selected);
              setConfirmOpen(true);
            }}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"
            title="Delete selected questions"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
          {selectedCount > 0 && (
            <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
              {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Show/Hide filters toggle button */}
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
          {/* Clear all filters + search */}
          <button
            onClick={() => {
              const api = gridApiRef.current as any;
              const hasSearch = !!(query && query.length);
              filterModelRef.current = {};
              // If we will also clear search, guard before calling setFilterModel so the onFilterChanged is skipped
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
      
      {/* Active filter chips */}
      {(query || Object.keys(filterModelRef.current || {}).length > 0) && (
        <div className="mb-3 flex items-center flex-wrap gap-2">
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
              id: 'ID', title: 'Question Title', subject: 'Subject', topic: 'Topic', level: 'Level',
              language: 'Language', createdAt: 'Created Date', updatedAt: 'Updated Date', createdBy: 'Created By'
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
                  api?.setFilterModel?.(fm); // will trigger onFilterChanged -> debounced fetch
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
                // Skip the filter-triggered fetch; query change will fetch once
                skipNextFilterFetchRef.current = true;
              }
              api?.setFilterModel?.(null); // onFilterChanged will clear chips; fetch is handled per above
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
      
      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <div className="bg-white shadow rounded-md border border-gray-300 p-8">
          <div className="text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-500 mb-4">
              No questions found. Try adjusting your search criteria or add new questions.
            </p>
            <Link href="/admin/questions/new">
              <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors duration-300">
                Add New Question
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <AgGridReact<QuestionRow>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={rows}
          onGridReady={onGridReady}
          onSortChanged={onSortChanged}
          onFilterChanged={() => {
            console.log('Filter changed event triggered - using client-side filtering');
            // For client-side filtering, we don't need to fetch new data
            // AG Grid will handle the filtering automatically
            const api = gridApiRef.current as any;
            if (!api) {
              console.log('Grid API not available');
              return;
            }
            
            const fm = api.getFilterModel?.() as any;
            console.log('Current filter model:', fm);
            
            filterModelRef.current = fm || {};
            setFiltersVersion((v) => v + 1);
            
            // No API call needed for client-side filtering
            console.log('Client-side filtering applied');
          }}
          onSelectionChanged={() => {
            const api = gridApiRef.current;
            if (!api) return;
            const selected = api.getSelectedRows?.() as QuestionRow[];
            setSelectedCount(selected?.length || 0);
          }}
          // Enable client-side pagination
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          // Client-side operations
          rowSelection={{ mode: 'multiRow', checkboxes: true }}
          selectionColumnDef={{ pinned: 'left', width: 44, headerName: '', resizable: false, cellClass: 'no-right-border', headerClass: 'no-right-border', suppressMovable: true }}
          animateRows
          domLayout="autoHeight"
          headerHeight={36}
          rowHeight={32}
          tooltipShowDelay={300}
          suppressMenuHide={false}
          suppressRowDeselection={true}
          stopEditingWhenCellsLoseFocus={true}
          theme="legacy"
        />
      )}
      
      {/* Remove separator between selection checkbox column and S.No */}
      <style jsx global>{`
        .ag-theme-alpine.ag-theme-evalus .ag-cell.no-right-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border {
          border-right: none !important;
        }
        /* Also ensure the first data column next to selection has no left border for a seamless look */
        .ag-theme-alpine.ag-theme-evalus .ag-center-cols-container .ag-row .ag-cell.no-left-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-row .ag-header-cell.no-left-border {
          border-left: none !important;
        }
        /* Hide resize handle so no vertical divider line appears on these columns */
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border .ag-header-cell-resize,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-left-border .ag-header-cell-resize {
          display: none !important;
        }
      `}</style>
      
      <ConfirmationModal
        title="Confirm Delete"
        message={pendingDelete.length > 0 
          ? pendingDelete.length === 1 
            ? `Are you sure you want to delete "${pendingDelete[0].title}"? This action cannot be undone.`
            : `Are you sure you want to delete ${pendingDelete.length} questions? This action cannot be undone.`
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
            // Delete all selected questions
            const deletePromises = pendingDelete.map(question => deleteQuestionAction(question.id));
            const results = await Promise.all(deletePromises);
            
            const failedDeletes = results.filter(res => res.status !== 200);
            
            if (failedDeletes.length === 0) {
              setToast({ 
                message: pendingDelete.length === 1 
                  ? "Question deleted successfully." 
                  : `${pendingDelete.length} questions deleted successfully.`, 
                type: "success" 
              });
            } else {
              setToast({ 
                message: `${failedDeletes.length} questions failed to delete.`, 
                type: "error" 
              });
            }
            
            // Refresh the data
            fetchPage();
          } catch (error) {
            setToast({ message: "Delete operation failed", type: "error" });
          }
          
          setDeleting(false);
          setConfirmOpen(false);
          setPendingDelete([]);
        }}
      />
      
      {/* Toast container top-right */}
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

export default function QuestionsPage() {
  const [query, setQuery] = useState("");

  // Load persisted search on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("admin-questions-search") ?? "";
    if (saved) setQuery(saved);
  }, []);

  // Persist search whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("admin-questions-search", query);
  }, [query]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
        <PageHeader
          icon={<HelpCircle className="w-6 h-6 text-indigo-600" />}
          title="Questions"
          showSearch
          searchValue={query}
          onSearch={(e) => setQuery(e)}
        />
      </div>

      <TabsRoot defaultIndex={0}>
        <div className="flex justify-between items-center mb-4">
          <TabsList labels={["Questions", "Subject"]} />
        </div>

        <TabsContent>
          {/* 0: Questions List */}
          <div className="bg-white shadow rounded-lg p-2">
            <QuestionsGrid query={query} onClearQuery={() => setQuery("")} />
          </div>

          {/* 1: Subject */}
          <div className="bg-white p-6 rounded-md shadow border border-gray-300">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Management</h3>
              <p className="text-gray-500">Manage subjects and topics for questions organization.</p>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  );
}
