"use client";

import { useEffect, useState } from "react";

export function AccessDate() {
  const [day, setDay] = useState("");
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
  }, []);
  return <span>{day || "the day you open this page"}</span>;
}
