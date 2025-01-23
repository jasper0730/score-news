import HomeHeader from "@/components/pages/home/HomeHeader";
import { useUser } from "@/providers/UserProvider";

export default function Dashboard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();

  return (
    <>
      <HomeHeader user={user} />
      <section className="pt-[256px]">
        {children}
      </section>
    </>
  );
}
