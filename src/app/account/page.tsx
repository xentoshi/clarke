import { redirect } from "next/navigation";
import { buildMeta } from "@/lib/metadata";
import { getSession } from "@/lib/auth";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata = buildMeta({
  title: "Account",
  description: "Clarke Terminal seat and API key.",
  tag: "Account",
  path: "/account",
  image: "/og/page/account.png",
});

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  return <AccountClient email={session.email} plan={session.plan} demo={session.demo} />;
}
