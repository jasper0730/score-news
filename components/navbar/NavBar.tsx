
import Link from "next/link";
import Logo from "../ui/Logo";
import ThemeSwitcher from "../themeSwitcher/ThemeSwitcher";
import RegisterButton from "../auth/RegisterButton";
import { SessionType } from "@/app/types/SessionType";
import Avatars from "../ui/Avatars";


interface NavBarProps {
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
          <RegisterButton type={session ? "logout" : "login"} />
          <ThemeSwitcher />
          {session && <Link href="/dashboard" className="w-[35px] h-[35px] rounded-full relative">
            <Avatars src={session.image} />
          </Link>}
        </div>
      </nav>
    </>
  );
};

export default NavBar;