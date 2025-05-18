"use server";

import ActionResponse from "@/types/ActionResponse";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const generateMockProducts = (count: number): Product[] => {
  const categories = ["Electronics", "Clothing", "Books", "Home"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: categories[i % categories.length],
    price: +(Math.random() * 1000).toFixed(2),
    stock: Math.floor(Math.random() * 100),
  }));
};

export async function fetchProductsAction(): Promise<ActionResponse> {
  try {
    const allProducts = generateMockProducts(40);

    return {
      status: "success",
      message: "Fetching Products Successful",
      data: allProducts,
    };
  } catch (error) {
    console.log("Error Fetching Products", error);
    return { status: "failure", message: "Error Fetching Products" };
  }
}
