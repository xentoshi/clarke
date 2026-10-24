import { Suspense } from "react";
import { buildMeta } from "@/lib/metadata";
import LoginForm from "./LoginForm";

export const revalidate = false;

export const metadata = buildMeta({
  title: "Sign in",
  description: "Sign in with an email for a free Clarke session.",
  tag: "Account",
  path: "/login",
  image: "/og/page/login.png",
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
