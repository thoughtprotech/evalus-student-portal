export function isLocalUploadUrl(url: string) {
    try {
        // Absolute URL? Check pathname
        const u = new URL(url);
        return u.pathname.startsWith('/uploads/');
    } catch {
        // Relative path
        return url.startsWith('/uploads/');
    }
}

export async function deleteLocalUpload(pathOrUrl: string): Promise<boolean> {
    try {
        let p = pathOrUrl;
        try {
            const u = new URL(pathOrUrl);
            p = u.pathname; // strip origin
        } catch { /* relative */ }
        const res = await fetch(`/api/uploads?path=${encodeURIComponent(p)}`, { method: 'DELETE' });
        if (!res.ok) return false;
        return true;
    } catch {
        return false;
    }
}
