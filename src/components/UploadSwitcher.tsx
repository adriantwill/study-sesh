"use client"
import { useState } from "react";
import UploadButton from "./UploadButton";

export default function UploadSwitcher() {
  const [selectedOption, setSelectedOption] = useState<0 | 1>(0);
  return (
    <>
      <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border border-muted-hover">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-2xl bg-muted-hover transition-transform duration-300 ease-out ${selectedOption === 0 ? "translate-x-0" : "translate-x-full"
            }`}
        />
        {([0, 1] as const).map((option) => (
          <button
            key={option}
            className={`relative z-10 py-2 w-full cursor-pointer rounded-2xl transition-colors duration-200 ${selectedOption === option ? "text-foreground" : "text-foreground/70"
              }`}
            onClick={() => setSelectedOption(option)}
            type="button"
          >
            {option === 0 ? "PDF" : "Text"} to Questions
          </button>
        ))}
      </div>
      <UploadButton></UploadButton>
    </>
  );
}
