import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeFileName(name: string) {
    const base = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    return base.slice(0, 180);
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get('file');
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: true, message: 'No file provided (field: file)' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const profilesDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        try { await fs.mkdir(profilesDir, { recursive: true }); } catch { }

        const orig = sanitizeFileName(file.name || 'profile');
        const ext = path.extname(orig);
        const nameNoExt = path.basename(orig, ext);
        const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const fileName = `${nameNoExt}_${stamp}${ext || ''}`;
        const targetPath = path.join(profilesDir, fileName);

        await fs.writeFile(targetPath, buffer);

        const publicUrl = `/uploads/profiles/${fileName}`;
        return NextResponse.json({ status: 200, error: false, message: 'Uploaded', data: { url: publicUrl, name: fileName } });
    } catch (err: any) {
        return NextResponse.json({ error: true, message: err?.message || 'Upload failed' }, { status: 500 });
    }
}

// DELETE /api/uploads?path=/uploads/filename.ext
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let p = searchParams.get('path') || '';
        if (!p) return NextResponse.json({ error: true, message: 'Missing path' }, { status: 400 });
        // Only allow deleting under /uploads/profiles
        if (!p.startsWith('/uploads/profiles/')) return NextResponse.json({ error: true, message: 'Invalid path' }, { status: 400 });
        // Normalize and ensure it's inside public/uploads/profiles
        const profilesDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        const fileName = path.basename(p); // drop directories
        const target = path.join(profilesDir, fileName);
        // Optional: refuse to delete if fileName looks unsafe
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return NextResponse.json({ error: true, message: 'Unsafe filename' }, { status: 400 });
        await fs.unlink(target);
        return NextResponse.json({ status: 200, error: false, message: 'Deleted' });
    } catch (err: any) {
        // If file not found, still return success to be idempotent
        if (err?.code === 'ENOENT') return NextResponse.json({ status: 200, error: false, message: 'Already removed' });
        return NextResponse.json({ error: true, message: err?.message || 'Delete failed' }, { status: 500 });
    }
}
