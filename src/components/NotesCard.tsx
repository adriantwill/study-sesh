"use client";

import { useState } from "react";

const ITEMS = ["Upload Lectures", "Upload Lectures1"] as const;

export default function NotesCard() {
  const [checked, setChecked] = useState<boolean[]>([true, true]);

  return (
    <section className="h-full w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
      <header className="border-b border-border bg-muted-hover px-4 py-3">
        <h2 className="text-2xl font-bold leading-tight text-foreground">
          Notes
        </h2>
      </header>

      <div className="px-6 py-5">
        {ITEMS.map((item, index) => (
          <div key={`${item}`}>
            <label className="flex items-center gap-4 py-4 text-foreground">
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() =>
                  setChecked((prev) =>
                    prev.map((value, i) => (i === index ? !value : value)),
                  )
                }
                className="size-5 cursor-pointer rounded-sm border-border accent-primary transition-all duration-
                  200 ease-out checked:scale-110"
              />
              <span className="text-xl font-medium">{item}</span>
            </label>
            <hr className="my-4 border-border" />
          </div>
        ))}
      </div>
    </section>
  );
}
