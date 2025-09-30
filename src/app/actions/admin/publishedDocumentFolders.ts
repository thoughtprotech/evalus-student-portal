"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import type { ApiResponse } from "@/utils/api/types";

export interface PublishedDocumentFolderRow {
  id: number;
  name: string;
  parentId: number;
  language: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

export interface FetchFoldersParams {
  top?: number;
  skip?: number;
  orderBy?: string;
  filter?: string;
}

export async function fetchPublishedDocumentFoldersODataAction(
  params: FetchFoldersParams = { top: 15, skip: 0 }
): Promise<ApiResponse<{ rows: PublishedDocumentFolderRow[]; total: number }>> {
  const buildQuery = (opts: {
    useSelect: boolean;
    countStyle: 'v4' | 'v2' | 'none';
    top?: number;
    orderBy?: string;
    filter?: string;
  }) => {
    const sp = new URLSearchParams();
    if (typeof (opts.top ?? params.top) === 'number') sp.set('$top', String(opts.top ?? params.top));
    if (typeof params.skip === 'number' && (params.skip as number) > 0) sp.set('$skip', String(params.skip));
    if (opts.orderBy ?? params.orderBy) sp.set('$orderby', String(opts.orderBy ?? params.orderBy));
    if (opts.filter ?? params.filter) sp.set('$filter', String(opts.filter ?? params.filter));
    if (opts.countStyle === 'v4') sp.set('$count', 'true');
    if (opts.countStyle === 'v2') sp.set('$inlinecount', 'allpages');
    if (opts.useSelect) sp.set('$select', 'Id,PublishedDocumentFolderName,ParentId,Language,CreatedBy,CreatedDate,ModifiedBy,ModifiedDate');
    return `?${sp.toString()}`;
  };

  const parsePayload = (payload: any) => {
    // Try OData v4 first
    if (Array.isArray(payload)) {
      return { list: payload, total: payload.length };
    }
    if (payload?.value && Array.isArray(payload.value)) {
      const total = payload['@odata.count'] ?? payload['@odata.Count'] ?? payload.count ?? payload['odata.count'] ?? payload.total ?? payload.value.length ?? 0;
      return { list: payload.value, total: Number(total) || 0 };
    }
    // Try OData v2 shape: { d: { results: [], __count: 'N' } }
    if (payload?.d?.results && Array.isArray(payload.d.results)) {
      const totalStr = payload.d.__count ?? payload['__count'] ?? '0';
      return { list: payload.d.results, total: Number(totalStr) || payload.d.results.length || 0 };
    }
    return { list: [] as any[], total: 0 };
  };

  const mapRows = (list: any[]): PublishedDocumentFolderRow[] =>
    list.map((g: any) => ({
      id: g.PublishedDocumentFolderId ?? g.publishedDocumentFolderId ?? g.Id ?? g.id,
      name: g.PublishedDocumentFolderName ?? g.publishedDocumentFolderName ?? g.Name ?? g.name,
      parentId: g.ParentId ?? g.parentId ?? 0,
      language: g.Language ?? g.language ?? '',
      createdBy: g.CreatedBy ?? g.createdBy,
      createdDate: g.CreatedDate ?? g.createdDate,
      modifiedBy: g.ModifiedBy ?? g.modifiedBy,
      modifiedDate: g.ModifiedDate ?? g.modifiedDate,
    }));

  try {
    // Attempt 0: No query params at all (some servers are strict)
    let res = await apiHandler(endpoints.listPublishedDocumentFoldersOData, { query: '' } as any);
    if (res.status === 200 && res.data) {
      const { list, total } = parsePayload(res.data);
      return { status: 200, data: { rows: mapRows(list), total }, message: `Fetched ${list.length} folders` };
    }

    // Attempt 1: minimal params (small top), no count/select/order
    let query = buildQuery({ useSelect: false, countStyle: 'none', top: Math.min(100, params.top ?? 100) });
    res = await apiHandler(endpoints.listPublishedDocumentFoldersOData, { query });
    if (res.status === 200 && res.data) {
      const { list, total } = parsePayload(res.data);
      return { status: 200, data: { rows: mapRows(list), total }, message: `Fetched ${list.length} folders` };
    }

    // Attempt 2: add provided orderBy/filter, still no select, v4 count
    query = buildQuery({ useSelect: false, countStyle: 'v4', orderBy: params.orderBy, filter: params.filter, top: params.top });
    res = await apiHandler(endpoints.listPublishedDocumentFoldersOData, { query });
    if (res.status === 200 && res.data) {
      const { list, total } = parsePayload(res.data);
      return { status: 200, data: { rows: mapRows(list), total }, message: `Fetched ${list.length} folders` };
    }

    // Attempt 3: v2 inlinecount, no select
    query = buildQuery({ useSelect: false, countStyle: 'v2', orderBy: params.orderBy, filter: params.filter, top: params.top });
    res = await apiHandler(endpoints.listPublishedDocumentFoldersOData, { query });
    if (res.status === 200 && res.data) {
      const { list, total } = parsePayload(res.data);
      return { status: 200, data: { rows: mapRows(list), total }, message: `Fetched ${list.length} folders` };
    }

    // Attempt 4: add select (some servers allow after prior params work)
    query = buildQuery({ useSelect: true, countStyle: 'v4', orderBy: params.orderBy, filter: params.filter, top: params.top });
    res = await apiHandler(endpoints.listPublishedDocumentFoldersOData, { query });
    if (res.status === 200 && res.data) {
      const { list, total } = parsePayload(res.data);
      return { status: 200, data: { rows: mapRows(list), total }, message: `Fetched ${list.length} folders` };
    }

    return { status: res.status, error: true, message: res.message || 'Failed to fetch folders', errorMessage: res.errorMessage };
  } catch (e: any) {
    return { status: 500, error: true, message: 'Error fetching folders', errorMessage: e?.message };
  }
}

export async function createPublishedDocumentFolderAction(payload: { id: number; publishedDocumentFolderName: string; parentId: number; language: string }): Promise<ApiResponse<null>> {
  try {
    // Build tolerant body with multiple key casings the backend might accept
    const body = {
      // numeric id (often 0 for create)
      id: payload.id,
      Id: payload.id,
      publishedDocumentFolderId: payload.id,
      PublishedDocumentFolderId: payload.id,
      // name
      publishedDocumentFolderName: payload.publishedDocumentFolderName,
      PublishedDocumentFolderName: payload.publishedDocumentFolderName,
      // parent
      parentId: payload.parentId,
      ParentId: payload.parentId,
      // language
      language: payload.language,
      Language: payload.language,
    } as any;

    // Try a set of likely routes until one succeeds (2xx)
    const routes: Array<{ method: 'POST'; path: () => string; type: 'CLOSE' }> = [
      // Original singular
      { method: 'POST', path: () => `/api/PublishedDocumentFolder`, type: 'CLOSE' },
      // Pluralized conventional controller
      { method: 'POST', path: () => `/api/PublishedDocumentFolders`, type: 'CLOSE' },
      // With "Documents" segment (mirrors OData entity set name)
      { method: 'POST', path: () => `/api/PublishedDocumentsFolder`, type: 'CLOSE' },
      { method: 'POST', path: () => `/api/PublishedDocumentsFolders`, type: 'CLOSE' },
    ];

    for (const cfg of routes) {
      const res = await apiHandler({ method: cfg.method, path: cfg.path, type: cfg.type }, body);
      if (res && typeof res.status === 'number' && res.status >= 200 && res.status < 300) {
        return res as any;
      }
    }

    // Fallback to configured endpoint in case middleware rewrites paths
    const res = await apiHandler(endpoints.createPublishedDocumentFolder, body);
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to create folder', errorMessage: e?.message } as any;
  }
}

export async function updatePublishedDocumentFolderAction(id: number, payload: { id?: number; publishedDocumentFolderName: string; parentId: number; language: string }): Promise<ApiResponse<null>> {
  try {
    // Build a tolerant body with multiple key casings the backend might accept
    const body = {
      // numeric ids
      id,
      Id: id,
      publishedDocumentFolderId: id,
      PublishedDocumentFolderId: id,
      // name
      publishedDocumentFolderName: payload.publishedDocumentFolderName,
      PublishedDocumentFolderName: payload.publishedDocumentFolderName,
      // parent
      parentId: payload.parentId,
      ParentId: payload.parentId,
      // language
      language: payload.language,
      Language: payload.language,
    } as any;

    // Try a set of likely routes until one succeeds (2xx)
    const routes: Array<{ method: 'PUT'; path: () => string; type: 'CLOSE' }> = [
      // Original singular
      { method: 'PUT', path: () => `/api/PublishedDocumentFolder/${id}`, type: 'CLOSE' },
      // Pluralized conventional controller
      { method: 'PUT', path: () => `/api/PublishedDocumentFolders/${id}`, type: 'CLOSE' },
      // With "Documents" segment (mirrors OData entity set name)
      { method: 'PUT', path: () => `/api/PublishedDocumentsFolder/${id}`, type: 'CLOSE' },
      { method: 'PUT', path: () => `/api/PublishedDocumentsFolders/${id}`, type: 'CLOSE' },
    ];

    for (const cfg of routes) {
      const res = await apiHandler({ method: cfg.method, path: cfg.path, type: cfg.type }, body);
      if (res && typeof res.status === 'number' && res.status >= 200 && res.status < 300) {
        return res as any;
      }
    }

    // Fallback to configured endpoint in case middleware rewrites paths
    const res = await apiHandler(endpoints.updatePublishedDocumentFolder, { ...body, id });
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to update folder', errorMessage: e?.message } as any;
  }
}

export async function deletePublishedDocumentFolderAction(id: number): Promise<ApiResponse<null>> {
  try {
    // Try a few likely DELETE routes until one returns 2xx
    const candidates: Array<{ method: 'DELETE'; path: () => string; type: 'CLOSE' }> = [
      // Confirmed correct endpoint (from user/backend)
      { method: 'DELETE', path: () => `/api/PublishedDocumentsFolders/${id}`, type: 'CLOSE' },
    ];

    for (const cfg of candidates) {
      const res = await apiHandler(cfg as any, null as any);
      if (res && typeof res.status === 'number' && res.status >= 200 && res.status < 300) {
        return res as any;
      }
    }

    // Fallback to configured endpoint (in case middleware rewrites)
    const res = await apiHandler(endpoints.deletePublishedDocumentFolder, { id });
    return res as any;
  } catch (e: any) {
    return { status: 500, error: true, message: 'Failed to delete folder', errorMessage: e?.message };
  }
}
