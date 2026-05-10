import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount } from "@/lib/user-account";

export default async function RapportLogementPage() {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  return <LogementModule />;
}
