import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";
import LogementPage from "@/app/(public)/georisques-logement/page";

export default async function RapportLogementPage() {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  return <LogementPage />;
}
