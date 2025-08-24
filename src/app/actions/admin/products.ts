"use server";

import { ApiResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

// DTO aligned with server provided product structure
export interface ProductDto {
  productId: number;
  productName: string;
  language: string;
  isActive: number | boolean;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
}

// Fetch all products (currently endpoint returns full list; we can client paginate)
export async function fetchProductsAction(): Promise<ProductDto[]> {
  try {
    const res = await apiHandler(endpoints.getProducts, { query: "" });
    if (res.status !== 200 || res.error) return [];
    if (Array.isArray(res.data)) return res.data as ProductDto[];
    if (res.data && Array.isArray((res.data as any).value)) return (res.data as any).value as ProductDto[];
    return [];
  } catch (e) {
    return [];
  }
}

export async function fetchProductByIdAction(id: number): Promise<ProductDto | null> {
  try {
    const res = await apiHandler(endpoints.getProductById, { productId: id });
    if (res.status !== 200 || res.error) return null;
    return res.data as ProductDto;
  } catch (e) {
    return null;
  }
}

type SavePayload = Omit<ProductDto, "productId" | "createdDate" | "modifiedDate"> & { productId?: number };

export async function createProductAction(data: SavePayload): Promise<ApiResponse<ProductDto | null>> {
  try {
    const res = await apiHandler(endpoints.createProduct, data as any);
    if (res.status !== 200 || res.error) {
      return { status: res.status, message: res.message || "Failed to create product" };
    }
    return { status: 200, message: "Product created", data: res.data as ProductDto };
  } catch (e: any) {
    return { status: 500, message: e?.message || "Error creating product" };
  }
}

export async function updateProductAction(productId: number, data: Partial<SavePayload>): Promise<ApiResponse<ProductDto | null>> {
  try {
    // Normalize payload (API may require createdBy along with modifiedBy and numeric isActive)
    const normalized: any = {
      productId,
      productName: data.productName?.trim(),
      language: data.language?.trim(),
      isActive: data.isActive === undefined ? undefined : (Number(data.isActive) ? 1 : 0),
      // Preserve createdBy if provided; fallback to 'admin' to avoid 400 when backend expects it
      createdBy: (data as any).createdBy || 'admin',
      modifiedBy: (data as any).modifiedBy || 'admin',
    };
    // Remove undefined keys to avoid backend validation errors
    Object.keys(normalized).forEach(k => normalized[k] === undefined && delete normalized[k]);
    const res = await apiHandler(endpoints.updateProduct, normalized);
    if (res.status !== 200 || res.error) {
      return { status: res.status, message: res.message || "Failed to update product" };
    }
    return { status: 200, message: "Product updated", data: res.data as ProductDto };
  } catch (e: any) {
    return { status: 500, message: e?.message || "Error updating product" };
  }
}

export async function deleteProductAction(productId: number): Promise<ApiResponse<null>> {
  try {
    const res = await apiHandler(endpoints.deleteProduct, { productId });
    if (res.status !== 200 || res.error) {
      return { status: res.status, message: res.message || "Failed to delete product" };
    }
    return { status: 200, message: "Product deleted", data: null };
  } catch (e: any) {
    return { status: 500, message: e?.message || "Error deleting product" };
  }
}


