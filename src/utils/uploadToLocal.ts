export async function uploadToLocal(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/uploads', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json?.data?.url) {
        throw new Error(json?.message || 'Upload failed');
    }
    return { url: json.data.url as string };
}
