import { NextRequest, NextResponse } from 'next/server';
import { toggleStarredTestAction } from '@/app/actions/dashboard/starred/toggleStarredTest';

// Internal helper API route because server actions cannot be called directly inside a client component event handler
export async function POST(req: NextRequest) {
    try {
        const { testId, makeStarred } = await req.json();
        if (typeof testId !== 'number' || typeof makeStarred !== 'boolean') {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
        }
        const res = await toggleStarredTestAction(testId, makeStarred);
        return NextResponse.json(res, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({ message: e?.message || 'Error' }, { status: 500 });
    }
}
