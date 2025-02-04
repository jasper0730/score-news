'use client'
import Link from "next/link";
import SearchBar from "@/app/(root)/SearchBar";
import Logo from "@/components/ui/Logo";
import RegisterButton from "@/components/register/RegisterButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SortButton from "@/app/(root)/SortButton";
import Avatars from "@/components/ui/Avatars";
import { useSession } from "next-auth/react";

export type User = {
  id: string
  image?: string
} | null

const HomeHeader = () => {
  const currentUser = useSession()
  return (
    <div className="fixed top-0 left-0 w-full bg-white dark:bg-black z-10">
      <div className="px-5 pt-5 flex justify-between items-start gap-5">
        <div>
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="max-w-[500px] w-full mt-5 h-[120px] overflow-auto">是一個提供新聞瀏覽體驗的網站，特色包括評分、收藏、評論，讓讀者能夠更有互動性地參與新聞內容。  
          我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。</div>
        </div>
        <SearchBar />
        <div className="flex items-center gap-5 shrink-0">
          <RegisterButton type={currentUser.status === "authenticated" ? "logout" : "login"} />
          <ThemeSwitcher />
          {currentUser.status === "authenticated" && (
            <Link href="/dashboard" className="w-[35px] h-[35px] rounded-full relative">
              <Avatars src={currentUser.data.user?.image} />
            </Link>
          )}
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