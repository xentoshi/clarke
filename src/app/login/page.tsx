import { Suspense } from "react";
import { buildMeta } from "@/lib/metadata";
import LoginForm from "./LoginForm";

export const metadata = buildMeta({
  title: "Sign in",
  description: "Clarke Terminal seats — free registry or Pro demo.",
  tag: "Account",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
