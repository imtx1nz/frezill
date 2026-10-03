import { Wordmark } from "@/components/auth/Logo";
import { FridgeScene } from "@/components/auth/FridgeScene";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="relative hidden flex-1 overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-[#14a07a]/40 blur-3xl" />
        <p className="relative text-[1.375rem] font-bold tracking-[-0.02em] text-white">frezill</p>
        <div className="relative py-10">
          <FridgeScene />
        </div>
        <div className="relative max-w-md text-white">
          <h2 className="text-balance text-[2rem] font-bold leading-tight tracking-[-0.02em]">
            ตู้เย็นของทั้งบ้านในมือถือ
            <br />
            เตือนก่อนของเป็นซาก
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-[#d4efe4]">
            รู้ว่าอะไรต้องใช้ก่อน และคืนนี้ทำอะไรกินได้จากของที่มี
          </p>
        </div>
      </aside>

      <main className="flex w-full flex-col px-4 pb-10 pt-6 sm:px-8 lg:w-[540px] lg:flex-none lg:justify-center lg:px-14">
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <div className="mx-auto mt-10 w-full max-w-[400px] lg:mt-0">{children}</div>
      </main>
    </div>
  );
}
