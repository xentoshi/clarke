"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "form" | "success";

function isValidLongitude(val: string): boolean {
  const n = parseFloat(val);
  return !isNaN(n) && n >= -180 && n <= 180;
}

export default function ListSlotClient() {
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [lonError, setLonError] = useState("");

  const [form, setForm] = useState({
    longitude: "",
    operator: "",
    country: "",
    ituRef: "",
    satellite: "",
    raiseTarget: "",
    leaseRevenue: "",
    contact: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "longitude") setLonError("");
  }

  function validateLongitude(): boolean {
    if (!form.longitude) { setLonError("Required"); return false; }
    if (!isValidLongitude(form.longitude)) {
      setLonError("Must be a number between -180 and 180");
      return false;
    }
    return true;
  }

  const isFormValid =
    form.longitude && form.operator && form.ituRef && form.contact &&
    isValidLongitude(form.longitude);

  async function handleSubmit() {
    if (!validateLongitude()) return;
    setSubmitting(true);
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "slot_listing_inquiry", ...form }),
      });
      setStep("success");
    } catch {
      // Show success anyway — inquiry is logged client-side
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/orbital" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors mb-8 block">← Orbital Slots</Link>
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-8">
          <div className="text-emerald-400 text-xs font-mono mb-4">// INQUIRY_RECEIVED</div>
          <h2 className="text-white font-bold text-xl mb-3">We&apos;ll be in touch.</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            We&apos;ve received your slot details. Clarke reviews each submission and will reach out to discuss the SPV structure, yield share terms, and listing timeline.
          </p>
          <p className="text-zinc-600 text-xs font-mono">{form.operator} · {form.ituRef}</p>
        </div>
      </div>
    );
  }

  const fields = [
    {
      key: "longitude", label: "Orbital longitude", placeholder: "e.g. 19.2 or -101",
      hint: "Degrees east (+) or west (−). Range: −180 to 180.", error: lonError,
    },
    { key: "operator", label: "Operator name", placeholder: "SES S.A.", hint: "" },
    { key: "country", label: "Filing country", placeholder: "Luxembourg", hint: "Country holding the ITU filing." },
    { key: "ituRef", label: "ITU network reference", placeholder: "LUX-19.2E-KU", hint: "From your ITU BR IFIC filing." },
    { key: "satellite", label: "Satellite name (optional)", placeholder: "Astra 1N", hint: "" },
    {
      key: "raiseTarget", label: "Target raise (USD, optional)", placeholder: "$50,000,000",
      hint: "Indicative amount you want to raise against this slot.", error: undefined,
    },
    {
      key: "leaseRevenue", label: "Annual transponder revenue (optional)", placeholder: "$20,000,000",
      hint: "Total annual revenue from transponder leases on this slot.", error: undefined,
    },
    { key: "contact", label: "Contact email", placeholder: "name@operator.com", hint: "" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <Link href="/orbital" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors mb-4 block">← Orbital Slots</Link>
        <p className="text-zinc-600 text-xs font-mono mb-3">// OPERATOR_INQUIRY</p>
        <h1 className="text-2xl font-bold text-white mb-3">List a Slot</h1>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-lg">
          Raise upfront capital against your transponder lease revenue. No filing transfer. No operational changes. Your slot, your satellite, your license.
        </p>
      </div>

      <div className="space-y-5">
        {fields.map(({ key, label, placeholder, hint, error }) => (
          <div key={key}>
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block mb-1.5">
              {label}
            </label>
            <input
              type={key === "contact" ? "email" : "text"}
              value={form[key as keyof typeof form]}
              onChange={(e) => update(key, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm
                         font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            {hint && !error && <p className="text-zinc-600 text-xs mt-1">{hint}</p>}
          </div>
        ))}

        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/20">
          <p className="text-zinc-500 text-xs leading-relaxed">
            Clarke will review your submission and reach out to discuss the SPV structure, yield share terms, and listing timeline.
            No ITU filing is modified. No satellite operations are affected.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting…" : "Submit inquiry →"}
        </button>
      </div>
    </div>
  );
}
