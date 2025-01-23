import RegisterClient from "@/components/auth/RegisterClient";
import Link from "next/link";

const LoginPage = () => {
  return (<div className="flex justify-center w-full px-10 pt-[100px] pb-[50px]">
    <RegisterClient type={"login"} className="max-w-md w-full" />
    <Link href="/">回首頁</Link>
  </div>);
}

export default LoginPage;