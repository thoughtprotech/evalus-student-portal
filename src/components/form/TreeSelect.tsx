"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type TreeItem = {
    id: number;
    name: string;
    parentId: number;
};

export type TreeSelectProps = {
    label: string;
    items: TreeItem[];
    value: number | "";
    onChange: (val: number | "") => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
};

// Build a map of parent -> children sorted by name
function buildIndex(items: TreeItem[]) {
    const byParent = new Map<number, TreeItem[]>();
    for (const it of items) {
        const p = Number(it.parentId) || 0;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(it);
    }
    for (const [, list] of byParent) list.sort((a, b) => a.name.localeCompare(b.name));
    return byParent;
}

export default function TreeSelect({ label, items, value, onChange, placeholder = "Select…", disabled, required, className = "" }: TreeSelectProps) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const ref = useRef<HTMLDivElement | null>(null);

    const byParent = useMemo(() => buildIndex(items), [items]);
    const roots = useMemo(() => byParent.get(0) || byParent.get(-1) || [], [byParent]);
    const selected = useMemo(() => (typeof value === 'number' ? items.find(i => i.id === value) : undefined), [value, items]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('mousedown', onClick);
        window.addEventListener('keyup', onKey);
        return () => { window.removeEventListener('mousedown', onClick); window.removeEventListener('keyup', onKey); };
    }, [open]);

    const toggleExpand = (id: number) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const renderNodes = (nodes: TreeItem[], depth: number) => (
        <ul className="space-y-1">
            {nodes.map(node => {
                const kids = byParent.get(node.id) || [];
                const hasKids = kids.length > 0;
                const isOpen = expanded.has(node.id);
                return (
                    <li key={node.id}>
                        <div className="flex items-center">
                            <div style={{ width: depth * 12 }} />
                            {hasKids ? (
                                <button type="button" onClick={() => toggleExpand(node.id)} className="w-5 h-5 flex items-center justify-center mr-1 text-gray-700 border border-gray-300 rounded text-[10px] leading-none font-semibold bg-white hover:bg-indigo-50" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                                    {isOpen ? '−' : '+'}
                                </button>
                            ) : (
                                <span className="w-5 h-5 mr-1" />
                            )}
                            <button type="button" onClick={() => { onChange(node.id); setOpen(false); }} className={`flex-1 text-left px-2 py-1 rounded ${value === node.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-800'}`}>{node.name}</button>
                        </div>
                        {hasKids && isOpen && (
                            <div className="mt-1 ml-2">
                                {renderNodes(kids, depth + 1)}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div className={`w-full ${className}`} ref={ref}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white flex items-center justify-between">
                <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>{selected ? selected.name : placeholder}</span>
                <svg className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute mt-1 w-[40rem] max-w-[min(100vw-2rem,40rem)] bg-white border border-gray-200 rounded-md shadow-lg z-40 p-2">
                    <div className="max-h-80 overflow-auto pr-1">
                        {renderNodes(roots, 0)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <button type="button" onClick={() => onChange("")} className="text-sm text-gray-600 hover:text-gray-800">Clear</button>
                        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
