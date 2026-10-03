"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
};

export function Field({ label, name, type = "text", autoComplete, defaultValue, error, hint, autoFocus }: Props) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && reveal ? "text" : type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-13 w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--brand-soft)] ${
            isPassword ? "pr-13" : ""
          } ${error ? "border-danger focus:border-danger focus:shadow-[0_0_0_4px_var(--danger-soft)]" : "border-line"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={reveal}
            className="absolute inset-y-0 right-0 grid w-13 place-items-center rounded-r-xl text-ink-3 hover:text-ink"
          >
            {reveal ? <EyeOff className="size-5" strokeWidth={2} /> : <Eye className="size-5" strokeWidth={2} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
