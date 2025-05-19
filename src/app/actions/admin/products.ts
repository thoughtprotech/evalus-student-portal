"use server";

import ActionResponse from "@/types/ActionResponse";

interface Product {
  id: number;
  name: string;
  category: string;
  subject: string;
  discount: number;
}

const generateMockProducts = (count: number): Product[] => {
  const categories = ["Electronics", "Clothing", "Books", "Home"];
  const subjects = ["English", "Maths", "Science", "Hindi"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: categories[i % categories.length],
    subject: subjects[i % subjects.length],
    discount: Math.floor(Math.random() * 100),
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
