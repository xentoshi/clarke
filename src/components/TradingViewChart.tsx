"use client";

import { useEffect, useRef } from "react";

interface Props {
  ticker: string;
  height?: number;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: object) => void;
    };
  }
}

export default function TradingViewChart({ ticker, height = 440 }: Props) {
  const containerId = `tv-${ticker}`;
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;

    const existing = document.getElementById("tv-script");
    if (existing) {
      initWidget();
      return;
    }

    const script = document.createElement("script");
    script.id = "tv-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      initWidget();
    };
    document.head.appendChild(script);

    function initWidget() {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        container_id: containerId,
        symbol: ticker,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        width: "100%",
        height,
        backgroundColor: "rgba(9,9,11,1)",
        gridColor: "rgba(39,39,42,0.3)",
        toolbar_bg: "#09090b",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
        save_image: false,
        studies: [],
        show_popup_button: false,
      });
    }
  }, [ticker, height, containerId]);

  return (
    <div
      id={containerId}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-zinc-800"
    />
  );
}
