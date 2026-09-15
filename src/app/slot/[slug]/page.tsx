import { redirect } from "next/navigation";
import { getAllRegistrySlugs } from "@/lib/satellites";
import { slots as curatedSlots } from "@/data/orbital-slots";

type Params = { slug: string };

export async function generateStaticParams() {
  return getAllRegistrySlugs(curatedSlots).map((slug) => ({ slug }));
}

export default async function SlotAlias({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  redirect(`/orbital/${slug}`);
}
