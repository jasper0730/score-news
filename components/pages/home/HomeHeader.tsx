'use client'
import Link from "next/link";
import SearchBar from "@/components/searchBar/SearchBar";
import Logo from "@/components/ui/Logo";
import RegisterButton from "@/components/auth/RegisterButton";
import ThemeSwitcher from "@/components/themeSwitcher/ThemeSwitcher";
import SortButton from "@/components/buttons/SortButton";
import Avatars from "@/components/ui/Avatars";
import { User } from "@/providers/UserProvider";

type HomeHeaderProps = {
  user: User | null
}

const HomeHeader = ({ user }: HomeHeaderProps) => {

  return (
    <div className="fixed top-0 left-0 w-full bg-white dark:bg-black z-10">
      <div className="px-5 pt-5 flex justify-between items-start gap-5">
        <div>
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="max-w-[500px] w-full mt-5 h-[120px] overflow-auto">Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi rem soluta beatae alias. Ea maiores est corporis earum, non, temporibus quos facilis enim amet itaque adipisci a aperiam beatae alias natus cumque dolores corrupti? Incidunt praesentium nihil possimus aut aliquid. possimus aut aliquid possimus aut aliquid possimus aut aliquid</div>
        </div>
        <SearchBar />
        <div className="flex items-center gap-5 shrink-0">
          <RegisterButton type={user ? "logout" : "login"} />
          <ThemeSwitcher />
          {user && <Link href="/dashboard" className="w-[35px] h-[35px] rounded-full relative">
            <Avatars src={user.image} />
          </Link>}
        </div>
      </div>
      <div className="flex mt-5 ml-auto px-5 justify-end">
        <SortButton type="rating" />
        <SortButton type="date" />
      </div >
    </div >
  );
}

export default HomeHeader;