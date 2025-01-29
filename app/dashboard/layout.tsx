
import { getUser } from "@/actions/getUser";
import NavBar from "@/app/dashboard/NavBar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getUser()

  return (
    <>
      <NavBar session={session} />
      <section className="pt-[--navH]">
        {children}
      </section>
    </>
  );
}
