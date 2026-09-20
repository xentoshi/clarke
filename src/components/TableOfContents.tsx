"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
  sub?: boolean;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const offset = 100;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = item.id;
        }
      }
      setActiveId(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  return (
    <nav className="space-y-0.5">
      <div className="text-xs text-faint mb-4">Contents</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={`block py-1 text-sm leading-snug transition-colors ${
            item.sub ? "pl-3" : ""
          } ${
            activeId === item.id
              ? "text-ink"
              : "text-faint hover:text-ink"
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
