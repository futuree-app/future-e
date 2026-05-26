import { AskFutureMount } from "@/components/AskFutureMount";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AskFutureMount />
    </>
  );
}
