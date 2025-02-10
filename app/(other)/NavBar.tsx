"use cliet"
import Link from "next/link";
import Logo from "../../components/ui/Logo";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import RegisterButton from "../../components/register/RegisterButton";
import { SessionType } from "@/app/types/SessionType";
import Avatars from "../../components/ui/Avatars";

type NavBarProps = {
  session: SessionType | null
}
const NavBar = ({ session }: NavBarProps) => {
  return (
    <>
      <nav className="flex justify-between items-center p-5 fixed top-0 left-0 w-full bg-white z-10 dark:bg-black">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <div className="flex items-center gap-5">
          {session && (
            <Link className="hover:opacity-70 duration-300" href="/">前台</Link>
          )}
          <RegisterButton type={session ? "logout" : "login"} />
          <ThemeSwitcher />
          {session && <div className="w-[35px] h-[35px] rounded-full relative">
            <Avatars src={session.image} />
          </div>}
        </div>
      </nav>
    </>
  );
};

export default NavBar;