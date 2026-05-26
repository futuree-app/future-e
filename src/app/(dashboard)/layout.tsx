import { AskFutureMount } from "@/components/AskFutureMount";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AskFutureMount />
    </>
  );
}
