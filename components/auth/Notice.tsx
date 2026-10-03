import { CircleAlert, MailCheck } from "lucide-react";

export function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const isError = tone === "error";
  const Icon = isError ? CircleAlert : MailCheck;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-3 rounded-xl px-4 py-3 text-[0.9375rem] leading-relaxed ${
        isError ? "bg-danger-soft text-[#7a1810]" : "bg-brand-soft text-brand-ink"
      }`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
      <p>{children}</p>
    </div>
  );
}
