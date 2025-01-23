import { getUser } from "@/actions/getUser";
import { SessionType } from "../types/SessionType";
import HomeHeader from "@/components/pages/home/HomeHeader";

export default async function Dashboard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: SessionType | null = await getUser();

  return (
    <>
      <HomeHeader session={session} />
      <section className="pt-[256px]">
        {children}
      </section>
    </>
  );
}
