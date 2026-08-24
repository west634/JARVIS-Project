import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/guards";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(`/${roleHomePath(session.role)}`);
}
