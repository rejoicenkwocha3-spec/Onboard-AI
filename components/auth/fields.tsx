"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const inputCls =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  label: string; error?: string; id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        id={id} name={id} {...props}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputCls} ${error ? "border-red-400" : "border-line"}`}
      />
      {error && <p id={`${id}-err`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  label: string; error?: string; id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          id={id} name={id} {...props} type={show ? "text" : "password"}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className={`${inputCls} pr-11 ${error ? "border-red-400" : "border-line"}`}
        />
        <button
          type="button" onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-muted hover:text-ink"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p id={`${id}-err`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit" disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Banner({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2.5 text-sm ${
        error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-success"
      }`}
    >
      {error ?? success}
    </div>
  );
}
