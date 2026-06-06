import { redirect } from "next/navigation";

// Stocks were consolidated into the unified Markets page. Keep this path as a
// redirect so existing links still land.
export default function StocksPage() {
  redirect("/markets");
}
