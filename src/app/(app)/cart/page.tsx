import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCartItemsWithProducts } from "@/lib/queries";
import { CartPanel } from "@/components/cart/cart-panel";
import Link from "next/link";

export default async function CartPage() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") redirect("/dashboard/client");

  const items = await getCartItemsWithProducts(session.id);
  const country = session.country || "US";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Cart</h1>
        <p className="text-slate-500 mt-1">
          Review items, set your target prices, and submit a proposal to our sales team
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-slate-200 rounded-lg bg-white">
          <p className="text-slate-500 mb-4">Your cart is empty.</p>
          <Link
            href="/catalog"
            className="inline-block text-[#1e3a5f] font-medium hover:underline"
          >
            Browse catalog →
          </Link>
        </div>
      ) : (
        <CartPanel initialItems={items} userCountry={country} />
      )}
    </div>
  );
}
