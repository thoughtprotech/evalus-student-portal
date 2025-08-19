"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { Filter, XCircle, Trash2, PlusCircle } from "lucide-react";
import { fetchCandidatesAction, deleteCandidateAction, type CandidateRow } from "@/app/actions/admin/candidates";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
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

function NameCellRenderer(props: { value: string; data: CandidateRow }) {
    // Clicking first name goes directly to edit page (Actions column removed)
    return (
        <Link
            className="text-blue-600 hover:underline"
            href={`/admin/candidates/${props.data.candidateId}/edit`}
            title={`Edit ${props.value}`}
        >
            {props.value}
        </Link>
    );
}

function IsActiveCellRenderer(props: { value: number | boolean }) {
    const isActive = Boolean(props.value);
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

function CandidateGroupCellRenderer(props: { value: string }) {
    return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {props.value || 'Default'}
        </span>
    );
}

// Local date formatter: expects ISO or YYYY-MM-DD, outputs dd-mm-yyyy
function formatDate(value?: string) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const mon = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
}

function CandidatesGrid({ query, onClearQuery }: { query: string; onClearQuery?: () => void }) {
    const gridApiRef = useRef<GridApi | null>(null);
    const [rows, setRows] = useState<CandidateRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    // Start with filters hidden to match Questions screen behavior
    const [showFilters, setShowFilters] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<CandidateRow[]>([]);
    const [selectedCount, setSelectedCount] = useState(0);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
    const sortModelRef = useRef<SortModelItem[] | undefined>(undefined);
    const filterModelRef = useRef<any>({});
    const filterDebounceRef = useRef<any>(null);
    const [filtersVersion, setFiltersVersion] = useState(0);
    const lastReqIdRef = useRef(0);
    const skipNextFilterFetchRef = useRef(false);

    const columnDefs = useMemo<ColDef<CandidateRow>[]>(
        () => [
            {
                field: "firstName",
                headerName: "First Name",
                headerTooltip: "First Name",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                minWidth: 180,
                flex: 1.6,
                cellRenderer: NameCellRenderer,
                tooltipField: "firstName",
                cellClass: 'no-left-border',
                headerClass: 'no-left-border'
            },
            {
                field: "lastName",
                headerName: "Last Name",
                headerTooltip: "Last Name",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 150
            },
            {
                field: "email",
                headerName: "Email",
                headerTooltip: "Email Address",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                minWidth: 220,
                flex: 1.5
            },
            {
                field: "phoneNumber",
                headerName: "Phone Number",
                headerTooltip: "Phone Number",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 140
            },
            {
                field: "cellPhone",
                headerName: "Cell Phone",
                headerTooltip: "Cell Phone",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 140
            },
            {
                field: "address",
                headerName: "Address",
                headerTooltip: "Address",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                minWidth: 200,
                flex: 1.2
            },
            {
                field: "city",
                headerName: "City",
                headerTooltip: "City",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 120
            },
            {
                field: "state",
                headerName: "State",
                headerTooltip: "State",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 120
            },
            {
                field: "postalCode",
                headerName: "Postal Code",
                headerTooltip: "Postal Code",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 120
            },
            {
                field: "country",
                headerName: "Country",
                headerTooltip: "Country",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                width: 120
            },
            {
                field: "candidateGroup",
                headerName: "Candidate Group",
                headerTooltip: "Candidate Group",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                cellRenderer: CandidateGroupCellRenderer,
                width: 140
            },
            {
                field: "notes",
                headerName: "Notes",
                headerTooltip: "Notes",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'] },
                minWidth: 200,
                flex: 1,
                cellRenderer: (props: { value: string }) => (
                    <div title={props.value} className="truncate">
                        {props.value || '-'}
                    </div>
                )
            },
            {
                field: "isActive",
                headerName: "Status",
                headerTooltip: "Active Status",
                sortable: true,
                filter: 'agTextColumnFilter',
                filterParams: { buttons: ['apply', 'reset', 'clear'], debounceMs: 200 },
                valueGetter: (params: any) => {
                    const isActive = Boolean(params.data?.isActive);
                    return isActive ? 'Active' : 'Inactive';
                },
                cellRenderer: IsActiveCellRenderer,
                width: 125
            },
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

    // Fetch data (mirrors questions grid pattern)
    const fetchPage = useCallback(async () => {
        const reqId = ++lastReqIdRef.current;
        setLoading(true);

        const sort = sortModelRef.current?.[0];
        const fieldMap: Record<string, string> = {
            candidateId: 'candidateRegistrationId',
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'email',
            phoneNumber: 'phoneNumber',
            cellPhone: 'cellPhone',
            address: 'address',
            city: 'city',
            state: 'state',
            postalCode: 'postalCode',
            country: 'country',
            candidateGroup: 'candidateGroupName',
            notes: 'notes',
            isActive: 'isActive'
        };
        const orderBy = sort ? `${fieldMap[sort.colId] ?? 'candidateRegistrationId'} ${sort.sort}` : 'candidateRegistrationId desc';

        const filters: string[] = [];
        const search = (query ?? '').trim();
        if (search) {
            const esc = search.replace(/'/g, "''");
            filters.push(`(contains(firstName,'${esc}') or contains(lastName,'${esc}') or contains(email,'${esc}'))`);
        }

        const filterModel = filterModelRef.current || {};
        Object.entries(filterModel).forEach(([field, filterConfig]: [string, any]) => {
            if (!filterConfig) return;
            const serverField = fieldMap[field] || field;

            if (filterConfig.filterType === 'text' && filterConfig.filter) {
                const value = filterConfig.filter.replace(/'/g, "''");
                if (field === 'isActive') {
                    const lowerValue = value.toLowerCase();
                    if (lowerValue === 'active' || lowerValue === '1' || lowerValue === 'true') filters.push(`${serverField} eq 1`);
                    else if (lowerValue === 'inactive' || lowerValue === '0' || lowerValue === 'false') filters.push(`${serverField} eq 0`);
                    return;
                }
                switch (filterConfig.type) {
                    case 'contains':
                        filters.push(`contains(${serverField},'${value}')`); break;
                    case 'startsWith':
                        filters.push(`startswith(${serverField},'${value}')`); break;
                    case 'endsWith':
                        filters.push(`endswith(${serverField},'${value}')`); break;
                    case 'equals':
                        filters.push(`${serverField} eq '${value}'`); break;
                }
            } else if (filterConfig.filter !== undefined) {
                const value = String(filterConfig.filter).replace(/'/g, "''");
                if (field === 'isActive') {
                    const lowerValue = value.toLowerCase();
                    if (lowerValue === 'active' || lowerValue === '1' || lowerValue === 'true') filters.push(`${serverField} eq 1`);
                    else if (lowerValue === 'inactive' || lowerValue === '0' || lowerValue === 'false') filters.push(`${serverField} eq 0`);
                    return;
                }
                filters.push(`contains(${serverField},'${value}')`);
            }
        });

        const filter = filters.length ? Array.from(new Set(filters)).join(' and ') : undefined;
        const res = await fetchCandidatesAction({ top: pageSize, skip: (page - 1) * pageSize, orderBy, filter });

        if (reqId === lastReqIdRef.current) {
            if (res.status === 200 && res.data) {
                setRows(res.data.rows.slice());
                setTotal(res.data.total);
            } else {
                setToast({ message: res.message || 'Failed to fetch candidates', type: 'error' });
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
        <div className="ag-theme-alpine ag-theme-evalus flex flex-col h-full min-h-0 w-full h-full">
            <div className="mb-3 flex items-center justify-between gap-3 flex-none">
                <div className="flex items-center gap-3 flex-wrap">
                    <Link href="/admin/candidates/new">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
                            title="Create new candidate"
                        >
                            <PlusCircle className="w-4 h-4" /> New
                        </button>
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            const api = gridApiRef.current;
                            if (!api) return;
                            const selected = api.getSelectedRows?.() as CandidateRow[];
                            if (!selected || selected.length === 0) {
                                setToast({ message: "Please select at least one candidate to delete.", type: "info" });
                                return;
                            }
                            setPendingDelete(selected);
                            setConfirmOpen(true);
                        }}
                        disabled={deleting}
                        className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50"
                        title="Delete selected candidates"
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
                        const nameMap: Record<string, string> = {
                            candidateId: 'Candidate ID', firstName: 'First Name', lastName: 'Last Name',
                            email: 'Email', phoneNumber: 'Phone Number', cellPhone: 'Cell Phone',
                            address: 'Address', city: 'City', state: 'State', postalCode: 'Postal Code',
                            country: 'Country', candidateGroup: 'Candidate Group', notes: 'Notes',
                            isActive: 'Status', createdDate: 'Created Date', modifiedDate: 'Modified Date',
                            createdBy: 'Created By', modifiedBy: 'Modified By'
                        };
                        const labelBase = nameMap[key] || key;
                        const shortLabel = (() => {
                            const getCond = (mm: any) => (mm?.operator ? mm?.condition1 : mm) || mm;
                            const c = getCond(m);
                            if (!c) return `${labelBase}`;
                            const t = c.type || c.filterType || 'contains';
                            const isDateKey = key === 'createdDate' || key === 'modifiedDate';
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
                        }
                        }
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
                            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Found</h3>
                            <p className="text-gray-500 mb-4">
                                No candidates found. Try adjusting your search criteria or add new candidates.
                            </p>
                            <Link href="/admin/candidates/new">
                                <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors duration-300">
                                    Add New Candidate
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-0 relative">
                        <AgGridReact<CandidateRow>
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
                                const selected = api.getSelectedRows?.() as CandidateRow[];
                                setSelectedCount(selected?.length || 0);
                            }}
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
                        {loading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                                <Loader />
                                <p className="mt-2 text-sm text-gray-600">Loading candidates...</p>
                            </div>
                        )}
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
                        ? `Are you sure you want to delete "${pendingDelete[0].firstName} ${pendingDelete[0].lastName}"? This action cannot be undone.`
                        : `Are you sure you want to delete ${pendingDelete.length} candidates? This action cannot be undone.`
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
                        const deletePromises = pendingDelete.map(candidate => deleteCandidateAction(candidate.candidateId));
                        const results = await Promise.all(deletePromises);

                        const failedDeletes = results.filter(res => res.status !== 200);

                        if (failedDeletes.length === 0) {
                            setToast({
                                message: pendingDelete.length === 1
                                    ? "Candidate deleted successfully."
                                    : `${pendingDelete.length} candidates deleted successfully.`,
                                type: "success"
                            });
                        } else {
                            setToast({
                                message: `${failedDeletes.length} candidates failed to delete.`,
                                type: "error"
                            });
                        }

                        const api = gridApiRef.current;
                        if (api) {
                            api.deselectAll?.();
                            setSelectedCount(0);
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

export default function CandidatesPage() {
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = sessionStorage.getItem("admin-candidates-search") ?? "";
        if (saved) setQuery(saved);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        sessionStorage.setItem("admin-candidates-search", query);
    }, [query]);

    return (
        <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
            <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
                <PageHeader
                    icon={<User className="w-6 h-6 text-indigo-600" />}
                    title="Candidates"
                    showSearch
                    searchValue={query}
                    onSearch={(e) => setQuery(e)}
                />
            </div>
            <div className="bg-white shadow rounded-lg p-2 flex-1 min-h-0 overflow-hidden">
                <CandidatesGrid query={query} onClearQuery={() => setQuery("")} />
            </div>
        </div>
    );
}