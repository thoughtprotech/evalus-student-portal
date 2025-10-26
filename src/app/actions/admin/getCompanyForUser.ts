"use server";

import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { CompanyRow } from "@/app/actions/admin/companies";

// This assumes only one company per client, so fetch the first company
export async function getCompanyForUser(): Promise<CompanyRow | null> {
    const res = await fetchCompaniesAction({ top: 1 });
    if (res && res.data && res.data.rows && res.data.rows.length > 0) {
        return res.data.rows[0];
    }
    return null;
}
