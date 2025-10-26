"use server";

import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { CompanyRow } from "@/app/actions/admin/companies";

export async function getCompanyForUser(): Promise<CompanyRow | null> {
    const res = await fetchCompaniesAction({ top: 1 });
    if (res && res.data && res.data.rows && res.data.rows.length > 0) {
        return res.data.rows[0];
    }
    return null;
}
