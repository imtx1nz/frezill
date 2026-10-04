import { TabBar } from "@/components/shell/TabBar";
import { signOut } from "@/app/(auth)/actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TabBar ai={Boolean(process.env.GEMINI_API_KEY?.trim())} signOut={signOut} />
      <div className="flex flex-1 flex-col pb-[var(--tabbar-h)] lg:pb-0">{children}</div>
    </>
  );
}
