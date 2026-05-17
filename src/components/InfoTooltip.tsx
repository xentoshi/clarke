"use client";

import { useState } from "react";

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs leading-none"
        aria-label="More info"
      >
        ⓘ
      </button>
      {visible && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs rounded px-3 py-2 z-50 leading-relaxed pointer-events-none shadow-lg"
          role="tooltip"
        >
          {text}
        </span>
      )}
    </span>
  );
}
