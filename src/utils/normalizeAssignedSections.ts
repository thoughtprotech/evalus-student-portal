// Utility to normalize legacy/variant TestAssignedSections arrays into a canonical shape.
// It searches the provided root object for candidate arrays containing section-like objects
// (objects that have any variant of a section id field). It then maps variant field names
// to the canonical fields expected by the UI: TestSectionId, TestSectionName, SectionOrder,
// SectionTotalQuestions, SectionTotalMarks, TestAssignedSectionId.
// Duplicates (by TestSectionId) are collapsed; first non-empty name wins; order is preserved
// by the smallest discovered order value, else insertion sequence, and then re-assigned
// sequentially starting at 1 to guarantee contiguous ordering.

export type CanonicalAssignedSection = {
  // Canonical section id used by UI; equals the actual TestSectionId from the catalog
  TestAssignedSectionId: number;
  TestSectionName: string;
  SectionOrder: number;
  SectionTotalQuestions?: number;
  SectionTotalMarks?: number;
  // Use camelCase for API compatibility
  sectionMinTimeDuration?: number;
  sectionMaxTimeDuration?: number;
};

// Include both section id variants and (legacy) testAssignedSectionId which in older APIs actually stores the section id
// Ordering gives priority to explicit TestSectionId keys; testAssignedSectionId is used as a fallback when section id is absent.
const ID_KEYS = [
  "testsectionid", "testsectionId", "testSectionId", // canonical / common variants
  "sectionid", "sectionId", "section_id", "testsection_id", // generic section id variants
  "testassignedsectionid", "testAssignedSectionId" // legacy field storing section id value
]; 
const NAME_KEYS = ["testsectionname", "testSectionName", "sectionname", "sectionName", "section_name"];
const ORDER_KEYS = ["sectionorder", "sectionOrder", "order", "sequence", "seq"];
const TOTAL_Q_KEYS = ["sectiontotalquestions", "sectionTotalQuestions", "totalquestions", "questions", "questioncount", "questionCount"];
const TOTAL_M_KEYS = ["sectiontotalmarks", "sectionTotalMarks", "totalmarks", "marks", "markstotal", "marksTotal"];
const MIN_TIME_KEYS = [
  "sectionmintimeduration","sectionmintime","mintime","minimumtime","sectionminimumtime",
  // camel / Pascal / mixed
  "sectionMinTimeDuration","sectionMinTime","minTime","minimumTime","sectionMinimumTime"
];
const MAX_TIME_KEYS = [
  "sectionmaxtimeduration","sectionmaxtime","maxtime","maximumtime","sectionmaximumtime",
  "sectionMaxTimeDuration","sectionMaxTime","maxTime","maximumTime","sectionMaximumTime"
];

function extractFirst(obj: any, keys: string[]) {
  if (!obj || typeof obj !== 'object') return undefined;
  // Fast path by scanning object keys once and checking case-insensitively
  const map = new Map<string, string | number | boolean | object | null | undefined>();
  for (const k of Object.keys(obj)) map.set(k.toLowerCase(), (obj as any)[k]);
  for (const want of keys) {
    const val = map.get(want.toLowerCase());
    if (val !== undefined) return val as any;
  }
  return undefined;
}

export function normalizeAssignedSections(root: any, maxDepth = 5): CanonicalAssignedSection[] {
  if (!root || typeof root !== 'object') return [];
  const visited = new Set<any>();
  const candidateArrays: any[][] = [];

  function scan(obj: any, depth: number) {
    if (!obj || typeof obj !== 'object' || depth > maxDepth || visited.has(obj)) return;
    visited.add(obj);
    for (const key of Object.keys(obj)) {
      const val: any = (obj as any)[key];
      if (Array.isArray(val) && val.length) {
        // Heuristic: at least one element with an id variant
        const looksLike = val.some(v => v && typeof v === 'object' && extractFirst(v, ID_KEYS) !== undefined);
        if (looksLike) candidateArrays.push(val);
      } else if (val && typeof val === 'object') {
        scan(val, depth + 1);
      }
    }
  }

  // Direct known properties first to give them priority
  if (Array.isArray((root as any).TestAssignedSections)) candidateArrays.push((root as any).TestAssignedSections);
  if (Array.isArray((root as any).testAssignedSections)) candidateArrays.push((root as any).testAssignedSections);

  scan(root, 0);

  const map = new Map<number, CanonicalAssignedSection & { _minOrder?: number }>();

  const addRecord = (raw: any) => {
    const idRaw = extractFirst(raw, ID_KEYS);
    const id = Number(idRaw);
    if (!Number.isFinite(id) || id <= 0) return;
    const nameRaw = extractFirst(raw, NAME_KEYS);
    const orderRaw = extractFirst(raw, ORDER_KEYS);
    const qRaw = extractFirst(raw, TOTAL_Q_KEYS);
    const mRaw = extractFirst(raw, TOTAL_M_KEYS);
    const existing = map.get(id);
    const orderNum = Number(orderRaw);
  if (!existing) {
      const minTimeRaw = extractFirst(raw, MIN_TIME_KEYS);
      const maxTimeRaw = extractFirst(raw, MAX_TIME_KEYS);
      
      // Handle time values properly - null/undefined should remain as such, 0 should be preserved
      const minTime = minTimeRaw != null ? Number(minTimeRaw) : (raw?.SectionMinTimeDuration != null ? Number(raw?.SectionMinTimeDuration) : undefined);
      const maxTime = maxTimeRaw != null ? Number(maxTimeRaw) : (raw?.SectionMaxTimeDuration != null ? Number(raw?.SectionMaxTimeDuration) : undefined);
      
      map.set(id, {
    TestAssignedSectionId: id,
        TestSectionName: (typeof nameRaw === 'string' && nameRaw.trim() !== '') ? nameRaw : (raw?.TestSectionName || raw?.SectionName || ""),
        SectionOrder: Number.isFinite(orderNum) ? orderNum : Number.MAX_SAFE_INTEGER, // temp
        SectionTotalQuestions: Number(qRaw) || 0,
        SectionTotalMarks: Number(mRaw) || 0,
        sectionMinTimeDuration: Number.isFinite(minTime) ? minTime : undefined,
        sectionMaxTimeDuration: Number.isFinite(maxTime) ? maxTime : undefined,
        _minOrder: Number.isFinite(orderNum) ? orderNum : undefined,
      });
    } else {
      // Merge: keep first non-empty name, prefer smaller order
      if (!existing.TestSectionName && typeof nameRaw === 'string' && nameRaw.trim() !== '') existing.TestSectionName = nameRaw;
      if (Number.isFinite(orderNum)) {
        if (!Number.isFinite(existing._minOrder!) || (orderNum as number) < (existing._minOrder as number)) {
          existing._minOrder = orderNum;
          existing.SectionOrder = orderNum;
        }
      }
      // Sum questions/marks (could also take max; summing is safer to not lose data)
      const qn = Number(qRaw); if (Number.isFinite(qn)) existing.SectionTotalQuestions = (existing.SectionTotalQuestions || 0) + qn;
      const mn = Number(mRaw); if (Number.isFinite(mn)) existing.SectionTotalMarks = (existing.SectionTotalMarks || 0) + mn;
      // Preserve first non-null min/max times
      const minTimeRaw = extractFirst(raw, MIN_TIME_KEYS);
      if ((existing as any).sectionMinTimeDuration == null && Number.isFinite(Number(minTimeRaw))) (existing as any).sectionMinTimeDuration = Number(minTimeRaw);
      const maxTimeRaw = extractFirst(raw, MAX_TIME_KEYS);
      if ((existing as any).sectionMaxTimeDuration == null && Number.isFinite(Number(maxTimeRaw))) (existing as any).sectionMaxTimeDuration = Number(maxTimeRaw);
    }
  };

  for (const arr of candidateArrays) {
    for (const row of arr) addRecord(row);
  }

  const list = Array.from(map.values());
  list.sort((a, b) => (a.SectionOrder || 0) - (b.SectionOrder || 0));
  list.forEach((r, i) => { r.SectionOrder = i + 1; delete (r as any)._minOrder; });
  return list;
}

export function assignedSectionsDiffer(a: any[] | undefined, b: any[] | undefined) {
  if (!Array.isArray(a) && !Array.isArray(b)) return false;
  if (!Array.isArray(a) || !Array.isArray(b)) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    const ra: any = a[i];
    const rb: any = b[i];
  if (Number(ra?.TestAssignedSectionId) !== Number(rb?.TestAssignedSectionId)) return true;
    if (Number(ra?.SectionOrder) !== Number(rb?.SectionOrder)) return true;
  }
  return false;
}
