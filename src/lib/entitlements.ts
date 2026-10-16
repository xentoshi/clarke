export interface Entitlements {
  loggedIn: boolean;
  email: string | null;
  plan: "free" | "pro";
  pro: boolean;
  demo: boolean;
  features: {
    valuationBreakdown: boolean;
    compare: boolean;
    exportPlus: boolean;
    api: boolean;
    history: boolean;
  };
}

/** Anonymous seat. Pages pass this during render so they do not read cookies. */
export function freeEntitlements(): Entitlements {
  return {
    loggedIn: false,
    email: null,
    plan: "free",
    pro: false,
    demo: false,
    features: {
      valuationBreakdown: false,
      compare: false,
      exportPlus: false,
      api: false,
      history: false,
    },
  };
}
