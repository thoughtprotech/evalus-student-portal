"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Filter, XCircle } from "lucide-react";
import {
  fetchTestsAction,
  deleteTestAction,
  type TestRow,
} from "@/app/actions/admin/tests";
import PageHeader from "@/components/PageHeader";
import PageUnderConstruction from "@/components/PageUnderConstruction";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { Trash2, PlusCircle, Rocket } from "lucide-react";
import Loader from "@/components/Loader";
import PaginationControls from "@/components/PaginationControls";
import Toast from "@/components/Toast";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  SortModelItem,
} from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// AG Grid v31+ uses modules; register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

function NameCellRenderer(props: { value: string; data: TestRow }) {
  return (
    <Link
      className="text-blue-600 hover:underline"
  href={`/admin/tests/edit/${props.data.id}`}
      onClick={() => {
        try {
          sessionStorage.removeItem("admin:newTest:model");
          sessionStorage.removeItem("admin:newTest:inWizard");
          sessionStorage.removeItem("admin:newTest:suppressClear");
          sessionStorage.removeItem("admin:newTest:preselectedIds");
          sessionStorage.removeItem("admin:newTest:selectedQuestions");
        } catch {}
      }}
      title={props.value}
    >
      {props.value}
    </Link>
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

function TestStatusCellRenderer(props: { value?: string }) {
  const v = (props.value || '').toString();
  const c = v.toLowerCase();
  const cls =
    c === 'published'
      ? 'bg-green-100 text-green-800'
      : c === 'new'
      ? 'bg-red-100 text-red-800'
      : c === 'on hold' || c === 'onhold'
      ? 'bg-amber-100 text-amber-800'
      : c === 'cancelled' || c === 'canceled'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{v || '-'}</span>;
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

function TestsGrid({
  query,
  onClearQuery,
}: {
  query: string;
  onClearQuery?: () => void;
}) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [rows, setRows] = useState<TestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TestRow | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState<TestRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  // Track current selection so toolbar buttons can enable/disable reactively
  const [selectedRow, setSelectedRow] = useState<TestRow | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const sortModelRef = useRef<SortModelItem[] | undefined>(undefined);
  const filterModelRef = useRef<any>({});
  const filterDebounceRef = useRef<any>(null);
  const [filtersVersion, setFiltersVersion] = useState(0); // trigger re-render when filter model changes
  const lastReqIdRef = useRef(0); // sequence requests to avoid stale overwrites
  const skipNextFilterFetchRef = useRef(false); // coordinate double fetch when also clearing search

  const columnDefs = useMemo<ColDef<TestRow>[]>(
    () => [
      // S.No. column removed per requirement. Checkbox selection column appears automatically when enabled.
      {
        field: "name",
        headerName: "Test Name",
        headerTooltip: "Test Name",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        width: 300,
        cellRenderer: NameCellRenderer,
        tooltipField: "name",
        cellClass: "no-left-border",
        headerClass: "no-left-border",
      },
      {
        field: "startDate",
        headerName: "Start Date",
        headerTooltip: "Test Start Date",
        sortable: true,
        filter: "agDateColumnFilter",
        filterParams: {
          buttons: ["apply", "reset", "clear"],
          browserDatePicker: true,
        },
        valueFormatter: ({ value }) => formatDate(value),
        width: 180,
      },
      {
        field: "endDate",
        headerName: "End Date",
        headerTooltip: "Test End Date",
        sortable: true,
        filter: "agDateColumnFilter",
        filterParams: {
          buttons: ["apply", "reset", "clear"],
          browserDatePicker: true,
        },
        valueFormatter: ({ value }) => formatDate(value),
        width: 180,
      },
      {
        field: "testStatus",
        headerName: "Test Status",
        headerTooltip: "Test Status",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        cellDataType: "text",
        cellRenderer: TestStatusCellRenderer,
        width: 140,
      },
      {
        field: "questions",
        headerName: "Questions",
        headerTooltip: "Total Questions",
        sortable: true,
        filter: "agNumberColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        width: 120,
      },
      {
        field: "level",
        headerName: "Level",
        headerTooltip: "Difficulty Level",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        cellRenderer: LevelCellRenderer,
        width: 160,
      },
      {
        field: "candidates",
        headerName: "Candidates",
        headerTooltip: "Assigned Candidates",
        sortable: true,
        filter: "agNumberColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        width: 140,
      },
      {
        field: "category",
        headerName: "Test Category",
        headerTooltip: "Category",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        width: 200,
      },
      {
        field: "template",
        headerName: "Test Template",
        headerTooltip: "Template",
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: { buttons: ["apply", "reset", "clear"] },
        minWidth: 220,
        flex: 1,
      },
      { field: "id", headerName: "ID", hide: true },
      { field: "code", headerName: "Test Code", hide: true },
    ],
    [page, pageSize]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: showFilters,
      suppressHeaderMenuButton: false,
    }),
    [showFilters]
  );

  const onGridReady = useCallback((e: GridReadyEvent) => {
    gridApiRef.current = e.api;
  }, []);

  // Fetch data whenever dependencies change
  const fetchPage = useCallback(async () => {
    const reqId = ++lastReqIdRef.current;
    setLoading(true);
    const sort = sortModelRef.current?.[0];
    const fieldMap: Record<string, string> = {
      id: "TestId",
      name: "TestName",
      startDate: "TestStartDate",
      endDate: "TestEndDate",
      status: "IsActive",
      questions: "TestQuestions@odata.count",
      level: "TestDifficultyLevel/TestDifficultyLevel1",
      candidates: "TestAssignments@odata.count",
      category: "TestCategory/TestCategoryName",
      template: "TestTemplate/TestTemplateName",
      code: "TestCode",
      testStatus: "TestStatus",
    };
    // Default order: latest created first
    const orderBy = sort
      ? `${fieldMap[sort.colId] ?? "CreatedDate"} ${sort.sort}`
      : "CreatedDate desc";
    const filters: string[] = [];
    const search = (query ?? "").trim();
    if (search)
      filters.push(`contains(TestName,'${search.replace(/'/g, "''")}')`);
    // Map AG Grid filter model to OData
    const fm = filterModelRef.current || {};
    const sanitize = (v: string) => v?.replace(/'/g, "''") ?? "";
    const booleanExpr = (odataField: string, m: any) => {
      if (!m) return null;
      // Handle Set Filter: { filterType: 'set', values: [...] }
      let raw: any = undefined;
      if (Array.isArray(m?.values)) {
        if (m.values.length !== 1) return null; // none or both -> no filter
        raw = m.values[0];
      } else {
        const cond = m?.operator ? m?.condition1 : m;
        raw = cond?.filter ?? cond?.value;
      }
      if (raw == null) return null;
      const v = String(raw).toLowerCase();
      let b: "true" | "false" | null = null;
      if (v === "true" || v === "active" || v === "1" || v === "yes")
        b = "true";
      else if (v === "false" || v === "inactive" || v === "0" || v === "no")
        b = "false";
      if (!b) return null;
      const t =
        (m?.type || (m?.operator ? m?.condition1?.type : undefined)) ??
        "equals";
      if (t === "notEqual") return `${odataField} ne ${b}`;
      return `${odataField} eq ${b}`;
    };
    const textExpr = (odataField: string, m: any) => {
      if (!m) return null;
      const build = (cond: any) => {
        const t = cond?.type || "contains";
        const val = sanitize(cond?.filter ?? "");
        if (!val && t !== "blank" && t !== "notBlank") return null;
        switch (t) {
          case "equals":
            return `${odataField} eq '${val}'`;
          case "notEqual":
            return `${odataField} ne '${val}'`;
          case "startsWith":
            return `startswith(${odataField},'${val}')`;
          case "endsWith":
            return `endswith(${odataField},'${val}')`;
          case "notContains":
            return `not contains(${odataField},'${val}')`;
          case "blank":
            return `${odataField} eq '' or ${odataField} eq null`;
          case "notBlank":
            return `${odataField} ne '' and ${odataField} ne null`;
          default:
            return `contains(${odataField},'${val}')`;
        }
      };
      if (m.operator && m.condition1 && m.condition2) {
        const a = build(m.condition1);
        const b = build(m.condition2);
        if (a && b) return `(${a}) ${m.operator} (${b})`;
        return a || b;
      }
      return build(m);
    };
    const numberExpr = (odataField: string, m: any) => {
      if (!m) return null;
      const toNum = (x: any) => Number(x);
      const build = (cond: any) => {
        const t = cond?.type || "equals";
        const v = toNum(cond?.filter);
        if (cond?.type === "inRange") {
          const from = toNum(cond?.filter);
          const to = toNum(cond?.filterTo);
          if (isFinite(from) && isFinite(to))
            return `${odataField} ge ${from} and ${odataField} le ${to}`;
          return null;
        }
        if (!isFinite(v)) return null;
        switch (t) {
          case "equals":
            return `${odataField} eq ${v}`;
          case "notEqual":
            return `${odataField} ne ${v}`;
          case "greaterThan":
            return `${odataField} gt ${v}`;
          case "greaterThanOrEqual":
            return `${odataField} ge ${v}`;
          case "lessThan":
            return `${odataField} lt ${v}`;
          case "lessThanOrEqual":
            return `${odataField} le ${v}`;
          default:
            return `${odataField} eq ${v}`;
        }
      };
      if (m.operator && m.condition1 && m.condition2) {
        const a = build(m.condition1);
        const b = build(m.condition2);
        if (a && b) return `(${a}) ${m.operator} (${b})`;
        return a || b;
      }
      return build(m);
    };
    const dateExpr = (odataField: string, m: any) => {
      if (!m) return null;
      const norm = (dstr?: string) => {
        if (!dstr) return null;
        // AG Grid date is YYYY-MM-DD
        return dstr;
      };
      const build = (cond: any) => {
        const t = cond?.type || "equals";
        if (t === "inRange") {
          const from = norm(cond?.dateFrom);
          const to = norm(cond?.dateTo);
          if (from && to)
            return `${odataField} ge ${from} and ${odataField} le ${to}`;
          return null;
        }
        const v = norm(cond?.dateFrom);
        if (!v) return null;
        switch (t) {
          case "equals":
            return `${odataField} eq ${v}`;
          case "greaterThan":
            return `${odataField} gt ${v}`;
          case "greaterThanOrEqual":
            return `${odataField} ge ${v}`;
          case "lessThan":
            return `${odataField} lt ${v}`;
          case "lessThanOrEqual":
            return `${odataField} le ${v}`;
          default:
            return `${odataField} eq ${v}`;
        }
      };
      if (m.operator && m.condition1 && m.condition2) {
        const a = build(m.condition1);
        const b = build(m.condition2);
        if (a && b) return `(${a}) ${m.operator} (${b})`;
        return a || b;
      }
      return build(m);
    };

    const fmId = fm.id ? numberExpr("TestId", fm.id) : null;
    const fmName = fm.name ? textExpr("TestName", fm.name) : null;
    const fmStart = fm.startDate
      ? dateExpr("TestStartDate", fm.startDate)
      : null;
    const fmEnd = fm.endDate ? dateExpr("TestEndDate", fm.endDate) : null;
  const fmStatus = fm.status ? booleanExpr("IsActive", fm.status) : null;
  const fmTestStatus = fm.testStatus ? textExpr("TestStatus", fm.testStatus) : null;
    const fmQuestions = fm.questions
      ? numberExpr("TestQuestions@odata.count", fm.questions)
      : null;
    const fmLevel = fm.level
      ? textExpr("TestDifficultyLevel/TestDifficultyLevel1", fm.level)
      : null;
    const fmCandidates = fm.candidates
      ? numberExpr("TestAssignments@odata.count", fm.candidates)
      : null;
    const fmCategory = fm.category
      ? textExpr("TestCategory/TestCategoryName", fm.category)
      : null;
    const fmTemplate = fm.template
      ? textExpr("TestTemplate/TestTemplateName", fm.template)
      : null;
    if (fmId) filters.push(fmId);
    if (fmName) filters.push(fmName);
    if (fmStart) filters.push(fmStart);
    if (fmEnd) filters.push(fmEnd);
  if (fmStatus) filters.push(fmStatus);
  if (fmTestStatus) filters.push(fmTestStatus);
    if (fmQuestions) filters.push(fmQuestions);
    if (fmLevel) filters.push(fmLevel);
    if (fmCandidates) filters.push(fmCandidates);
    if (fmCategory) filters.push(fmCategory);
    if (fmTemplate) filters.push(fmTemplate);
    const filter = filters.length
      ? Array.from(new Set(filters)).join(" and ")
      : undefined;

    const res = await fetchTestsAction({
      top: pageSize,
      skip: (page - 1) * pageSize,
      orderBy,
      filter,
    });
    // Only apply if this is the latest request
    if (reqId === lastReqIdRef.current) {
      if (res.status === 200 && res.data) {
  setRows(res.data.rows.slice());
  // Clear selection when data refreshes
  setSelectedRow(null);
        setTotal(res.data.total);
      }
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // No quick filters; header search and grid column filters will drive queries

  const onSortChanged = useCallback(() => {
    const model = (gridApiRef.current as any)?.getSortModel?.() as
      | SortModelItem[]
      | undefined;
    sortModelRef.current = model;
    // Reset to first page on sort change
    setPage(1);
  }, []);

  // Filtering is server-driven via the top-right search bar

  return (
    <div
      className="ag-theme-alpine ag-theme-evalus flex flex-col h-full min-h-0"
      style={{ width: "100%", height: "100%" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3 flex-none">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Actions: New, Publish and Delete */}
          <Link href="/admin/tests/new">
            <button
              className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700 cursor-pointer"
              title="Create new test"
              onClick={() => {
                try {
                  sessionStorage.removeItem("admin:newTest:model");
                  sessionStorage.removeItem("admin:newTest:inWizard");
                  sessionStorage.removeItem("admin:newTest:suppressClear");
                  sessionStorage.removeItem("admin:newTest:preselectedIds");
                  sessionStorage.removeItem("admin:newTest:selectedQuestions");
                } catch {}
              }}
            >
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </Link>
          <button
            onClick={() => {
              const row = selectedRow;
              if (!row) return;
              const hasStart = !!(row.startDate && String(row.startDate).trim());
              const hasEnd = !!(row.endDate && String(row.endDate).trim());
              if (!hasStart || !hasEnd) {
                const missing = [!hasStart ? "Start Date" : null, !hasEnd ? "End Date" : null]
                  .filter(Boolean)
                  .join(" and ");
                setToast({
                  message: `Please update ${missing} before publishing.`,
                  type: "warning",
                });
                return;
              }
              // Open confirmation modal for publishing
              setPendingPublish(row);
              setPublishConfirmOpen(true);
            }}
            disabled={!selectedRow || String(selectedRow.testStatus ?? "").toLowerCase() !== "new"}
            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            title="Publish selected test"
          >
            <Rocket className="w-4 h-4" /> Publish
          </button>
          <button
            onClick={() => {
              const row = selectedRow;
              if (!row) {
                setToast({
                  message: "Please select a test to delete.",
                  type: "info",
                });
                return;
              }
              setPendingDelete(row);
              setConfirmOpen(true);
            }}
            disabled={deleting || !selectedRow}
            className="inline-flex items-center justify-center gap-2 w-32 px-3 py-2 rounded-md bg-red-600 text-white text-sm shadow hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            title="Delete selected test"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            pageSizeOptions={[15, 25, 50, 100]}
            showTotalCount
          />
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
              <Filter className="w-4 h-4" />{" "}
              {showFilters ? "Hide Filters" : "Show Filters"}
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
              disabled={
                !query && Object.keys(filterModelRef.current || {}).length === 0
              }
            >
              <XCircle className="w-4 h-4" /> Clear Filters
            </button>
          </div>
        </div>
      </div>
      {/* Active filter chips */}
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
          {Object.entries(filterModelRef.current as Record<string, any>).map(
            ([key, m]) => {
              const nameMap: Record<string, string> = {
                id: "ID",
                code: "Test Code",
                name: "Test Name",
                startDate: "Start Date",
                endDate: "End Date",
                status: "Status",
                testStatus: "Test Status",
                questions: "Questions",
                level: "Level",
                candidates: "Candidates",
                category: "Test Category",
                template: "Test Template",
              };
              const labelBase = nameMap[key] || key;
              const shortLabel = (() => {
                const getCond = (mm: any) =>
                  (mm?.operator ? mm?.condition1 : mm) || mm;
                const c = getCond(m);
                if (!c) return `${labelBase}`;
                const t = c.type || c.filterType || "contains";
                const isDateKey = key === "startDate" || key === "endDate";
                const val = c.filter ?? c.dateFrom ?? "";
                // Set filter (e.g., Status)
                if (
                  c.filterType === "set" ||
                  Array.isArray((m as any)?.values)
                ) {
                  const values = (m as any)?.values || c.values || [];
                  if (Array.isArray(values) && values.length > 0) {
                    const disp = values.map((v: any) => String(v)).join(", ");
                    return `${labelBase}: ${disp}`;
                  }
                }
                if (isDateKey) {
                  if (t === "inRange")
                    return `${labelBase}: ${formatDate(
                      c.dateFrom
                    )} → ${formatDate(c.dateTo)}`;
                  if (val) return `${labelBase}: ${formatDate(val)}`;
                  return `${labelBase}`;
                }
                if (t === "inRange")
                  return `${labelBase}: ${c.dateFrom ?? c.filter} → ${
                    c.dateTo ?? c.filterTo
                  }`;
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
            }
          )}
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
      <div className="flex-1 min-h-0">
        {loading ? (
          <Loader />
        ) : (
          <div className="h-full min-h-0">
            <AgGridReact<TestRow>
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowData={rows}
              onGridReady={onGridReady}
              onSortChanged={onSortChanged}
              onSelectionChanged={() => {
                const api = gridApiRef.current as any;
                const selected = (api?.getSelectedRows?.() as TestRow[]) || [];
                setSelectedRow(selected[0] || null);
              }}
              onFilterChanged={() => {
                const fm = (
                  gridApiRef.current as any
                )?.getFilterModel?.() as any;
                filterModelRef.current = fm || {};
                setFiltersVersion((v) => v + 1);
                if (skipNextFilterFetchRef.current) {
                  skipNextFilterFetchRef.current = false;
                  return;
                }
                if (filterDebounceRef.current) {
                  clearTimeout(filterDebounceRef.current);
                }
                filterDebounceRef.current = setTimeout(() => {
                  // If already on page 1, fetch now; otherwise set page to 1 and let useEffect fetch once
                  if (page === 1) {
                    fetchPage();
                  } else {
                    setPage(1);
                  }
                }, 300);
              }}
              rowSelection={{ mode: "singleRow", checkboxes: true }}
              selectionColumnDef={{
                pinned: "left",
                width: 44,
                headerName: "",
                resizable: false,
                cellClass: "no-right-border",
                headerClass: "no-right-border",
                suppressMovable: true,
              }}
              animateRows
              headerHeight={36}
              rowHeight={32}
              tooltipShowDelay={300}
              // Let the last column flex to consume remaining space
              theme="legacy"
            />
          </div>
        )}
      </div>
      {/* Remove separator between selection checkbox column and S.No */}
      <style jsx global>{`
        .ag-theme-alpine.ag-theme-evalus .ag-cell.no-right-border,
        .ag-theme-alpine.ag-theme-evalus .ag-header-cell.no-right-border {
          border-right: none !important;
        }
        /* Also ensure the first data column next to selection has no left border for a seamless look */
        .ag-theme-alpine.ag-theme-evalus
          .ag-center-cols-container
          .ag-row
          .ag-cell.no-left-border,
        .ag-theme-alpine.ag-theme-evalus
          .ag-header-row
          .ag-header-cell.no-left-border {
          border-left: none !important;
        }
        /* Hide resize handle so no vertical divider line appears on these columns */
        .ag-theme-alpine.ag-theme-evalus
          .ag-header-cell.no-right-border
          .ag-header-cell-resize,
        .ag-theme-alpine.ag-theme-evalus
          .ag-header-cell.no-left-border
          .ag-header-cell-resize {
          display: none !important;
        }
      `}</style>
      <ConfirmationModal
        title="Confirm Delete"
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.name}"? This action cannot be undone.`
            : ""
        }
        isOpen={confirmOpen}
        variant="danger"
  className="max-w-md"
  messageClassName="text-xs"
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const res = await deleteTestAction(pendingDelete.id);
          setDeleting(false);
          setConfirmOpen(false);
          setPendingDelete(null);
          if (res.status === 200) {
            fetchPage();
            setToast({
              message: "Test deleted successfully.",
              type: "success",
            });
          } else {
            setToast({
              message: res.message || "Delete failed",
              type: "error",
            });
          }
        }}
      />

      {/* Publish confirmation */}
      <ConfirmationModal
        title="Confirm Publish"
        message={
          publishConfirmOpen && pendingPublish
            ? `Do you want to Publish "${pendingPublish.name}" with Start Date - ${formatDate(
                pendingPublish.startDate
              )} and End Date - ${formatDate(pendingPublish.endDate)}?`
            : ""
        }
        isOpen={publishConfirmOpen}
        variant="default"
        className="max-w-md"
        messageClassName="text-sm"
        confirmText={publishing ? "Publishing..." : "Yes, Publish"}
        cancelText="Cancel"
        confirmDisabled={publishing}
        onCancel={() => {
          setPublishConfirmOpen(false);
          setPendingPublish(null);
        }}
        onConfirm={async () => {
          if (!pendingPublish) return;
          setPublishing(true);
          const res = await apiHandler(endpoints.publishTest, { id: pendingPublish.id });
          setPublishing(false);
          setPublishConfirmOpen(false);
          setPendingPublish(null);
          if (res.status >= 200 && res.status < 300 && !res.error) {
            setToast({ message: "Test published successfully.", type: "success" });
            fetchPage();
          } else {
            setToast({
              message: res.errorMessage || res.message || "Publish failed",
              type: "error",
            });
          }
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

export default function TestsPage() {
  const [query, setQuery] = useState("");

  // Load persisted search on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("admin-tests-search") ?? "";
    if (saved) setQuery(saved);
  }, []);

  // Persist search whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("admin-tests-search", query);
  }, [query]);

  return (
    <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
        <PageHeader
          icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
          title="Tests"
          showSearch
          searchValue={query}
          onSearch={(e) => setQuery(e)}
        />
      </div>

      <div className="bg-white shadow rounded-lg p-2 flex-1 min-h-0 overflow-hidden">
        <TestsGrid query={query} onClearQuery={() => setQuery("")} />
      </div>
    </div>
  );
}
