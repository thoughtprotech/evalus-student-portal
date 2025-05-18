"use client";

import { useEffect, useState } from "react";
import { Box, Tag, DollarSign, Layers } from "lucide-react";
import { fetchProductsAction } from "@/app/actions/admin/products";
import Loader from "@/components/Loader";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const COLUMNS = [
  { key: "id", label: "ID", icon: <Layers className="w-4 h-4 mr-1" /> },
  { key: "name", label: "Name", icon: <Box className="w-4 h-4 mr-1" /> },
  {
    key: "category",
    label: "Category",
    icon: <Tag className="w-4 h-4 mr-1" />,
  },
  {
    key: "price",
    label: "Price",
    icon: <DollarSign className="w-4 h-4 mr-1" />,
  },
  { key: "stock", label: "Stock" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchProductsAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setProducts(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  const filteredAnnouncements = products.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const total = filteredAnnouncements.length;
  const slice = filteredAnnouncements.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<Box className="w-6 h-6 text-green-600" />}
        title="Products"
        newLink="/admin/products/new"
        onSearch={(e) => setQuery(e)}
      />

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                {
                  key: "id",
                  label: "ID",
                  icon: <Layers className="w-4 h-4 mr-1" />,
                },
                {
                  key: "name",
                  label: "Name",
                  icon: <Box className="w-4 h-4 mr-1" />,
                },
                {
                  key: "category",
                  label: "Category",
                  icon: <Tag className="w-4 h-4 mr-1" />,
                },
                {
                  key: "price",
                  label: "Price",
                  icon: <DollarSign className="w-4 h-4 mr-1" />,
                },
                { key: "stock", label: "Stock" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    {col.icon}
                    {col.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {slice.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{p.id}</td>
                <td className="px-6 py-4 text-sm text-green-600">
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {p.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${p.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
