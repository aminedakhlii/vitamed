import { parseJsonArray } from "@/lib/utils";

export type ProductFormData = {
  id?: string;
  code: string;
  name: string;
  category: string;
  description: string;
  materials: string;
  certifications: string;
  modelNumber: string;
  imageUrl: string;
  active: boolean;
  colors: string;
  sizes: string;
  specifications: string;
  countryPrices: { country: string; currency: string; price: string }[];
};

export function specsToText(specs: Record<string, string>) {
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function textToSpecs(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx > 0) {
      specs[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return specs;
}

export function csvToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function productToFormDefaults(product?: {
  id?: string;
  code: string;
  name: string;
  category: string;
  description: string;
  materials: string;
  certifications: string;
  modelNumber: string | null;
  imageUrl: string | null;
  active: boolean;
  colors: string;
  sizes: string;
  specifications: string;
  countryPrices: { country: string; currency: string; price: number }[];
}): ProductFormData {
  const specs = JSON.parse(product?.specifications || "{}") as Record<string, string>;
  return {
    id: product?.id,
    code: product?.code || "",
    name: product?.name || "",
    category: product?.category || "",
    description: product?.description || "",
    materials: product?.materials || "",
    certifications: product?.certifications || "",
    modelNumber: product?.modelNumber || "",
    imageUrl: product?.imageUrl || "",
    active: product?.active ?? true,
    colors: parseJsonArray<string>(product?.colors || "[]").join(", "),
    sizes: parseJsonArray<string>(product?.sizes || "[]").join(", "),
    specifications: specsToText(specs),
    countryPrices:
      product?.countryPrices?.map((p) => ({
        country: p.country,
        currency: p.currency,
        price: String(p.price),
      })) || [{ country: "US", currency: "USD", price: "" }],
  };
}
