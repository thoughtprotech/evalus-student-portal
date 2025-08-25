"use server";

import { apiHandler } from '@/utils/api/client';
import { endpoints } from '@/utils/api/endpoints';
import { getUserAction } from '../../getUser';
import { ApiResponse } from '@/utils/api/types';

export async function toggleStarredTestAction(testId: number, makeStarred: boolean): Promise<ApiResponse<null>> {
    try {
        const username = await getUserAction();
        if (!username) {
            return { status: 401, error: true, message: 'Unauthorized', errorMessage: 'User not authenticated' };
        }

        if (makeStarred) {
            const res = await apiHandler(endpoints.createStarredUserTest, { testId, userName: username });
            if (!res.error) {
                return { status: 200, error: false, message: 'Starred' };
            }
            return { status: res.status, error: true, message: 'Failed to star test', errorMessage: res.errorMessage };
        } else {
            const res = await apiHandler(endpoints.deleteStarredUserTest, { testId, userName: username });
            if (!res.error) {
                return { status: 200, error: false, message: 'Unstarred' };
            }
            return { status: res.status, error: true, message: 'Failed to unstar test', errorMessage: res.errorMessage };
        }
    } catch (e: any) {
        return { status: 500, error: true, message: 'Error toggling star', errorMessage: e?.message || 'Unknown error' };
    }
}

export async function listStarredTestsIdsAction(): Promise<number[]> {
    try {
        const username = await getUserAction();
        if (!username) return [];
        const res = await apiHandler(endpoints.listStarredUserTests, { username });
        if (!res.error && Array.isArray(res.data)) {
            return res.data.map(r => r.testId);
        }
        return [];
    } catch {
        return [];
    }
}
