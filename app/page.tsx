import { redirect } from "next/navigation";

// Landing page is a later milestone; until then "/" goes straight into the app (proxy sends guests to /login).
export default function Home() {
  redirect("/today");
}
