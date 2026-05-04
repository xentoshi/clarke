"use client";

import { useState } from "react";

function getDomain(website: string) {
  try {
    return new URL(website).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

interface Props {
  website: string;
  name: string;
  size?: number;
}

export default function CompanyLogo({ website, name, size = 32 }: Props) {
  const [failed, setFailed] = useState(false);
  const domain = getDomain(website);

  if (!domain || failed) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-xs font-bold font-mono shrink-0"
        style={{ width: size, height: size }}
      >
        {name[0]}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="rounded object-contain bg-white shrink-0"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
