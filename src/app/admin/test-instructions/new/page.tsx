"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { createTestInstructionAction } from "@/app/actions/admin/testInstructions";
import { ArrowLeft, Save, BookOpenText } from "lucide-react";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function NewTestInstructionPage(){
  const [name,setName]=useState("");
  const [instruction,setInstruction]=useState("");
  const [language,setLanguage]=useState("");
  const [languages,setLanguages]=useState<any[]>([]);
  const [status,setStatus]=useState(1); // 1 Active 0 Inactive
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<{message:string;type:any}|null>(null);
  const router = useRouter();

  useEffect(()=>{ (async()=>{ const res = await fetchLanguagesAction(); if(res.status===200 && res.data){ setLanguages(res.data); } })(); },[]);

  const canSave = name.trim().length>0 && language.trim().length>0 && instruction.trim().length>0;

  const save = async ()=>{
    if(!canSave) { setToast({ message:'Fill all required fields', type:'warning'}); return; }
    setSaving(true);
    const res = await createTestInstructionAction({ testInstructionName:name.trim(), testInstruction1: instruction, language, isActive: status });
    setSaving(false);
    if(res.status===200){ setToast({ message:'Instruction created', type:'success'}); setTimeout(()=> router.push('/admin/test-instructions'), 800); }
    else setToast({ message: res.message || 'Save failed', type:'error'});
  };

  return <div className="p-4 bg-gray-50 h-full flex flex-col">
    <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
      <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600"/>} title="New Test Instruction" showSearch={false} onSearch={()=>{}} />
    </div>
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/test-instructions" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4"/> Back</Link>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name<span className="text-red-500"> *</span></label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Instruction Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instruction<span className="text-red-500"> *</span></label>
            <RichTextEditor initialContent={instruction} onChange={setInstruction} placeholder="Enter instruction details" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language<span className="text-red-500"> *</span></label>
              <select value={language} onChange={e=>setLanguage(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Language</option>
                {languages.map(l=> <option key={l.languageId||l.language} value={l.language || l.language1 || l.languageName || l.Language}>{l.language || l.language1 || l.languageName || l.Language}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e=>setStatus(Number(e.target.value))} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <button onClick={save} disabled={!canSave || saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50"><Save className="w-4 h-4"/>{saving? 'Saving...':'Save'}</button>
        </div>
      </div>
    </div>
    <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>
  </div>;
}
