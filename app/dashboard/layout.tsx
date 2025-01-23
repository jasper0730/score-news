
import { getUser } from "@/actions/getUser";
import NavBar from "@/components/navbar/NavBar";


export default async function Dashboard({
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
