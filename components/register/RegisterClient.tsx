"use client"

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toastBox } from "@/utils/toast";
import Logo from "../ui/Logo";
import Input from "../Input";
import Button from "../Button";
import { z } from 'zod'

type RegisterClientProps = {
  type: "login" | "signup";
  setOpenModal?: (type: "login" | "signup" | null) => void;
  className?: string;
}

const formValueSchema = z.object({
  email: z
    .string({ required_error: 'Email 為必填欄位' })
    .email('請輸入正確的 Email'),
  password: z
    .string({ required_error: 'Password 為必填欄位' })
    .min(8, '密碼長度不可小於 8 個字元')
})

const RegisterClient = ({
  type,
  setOpenModal,
  className
}: RegisterClientProps) => {
  const router = useRouter()
  const formRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const { email, password } = Object.fromEntries(formData.entries());

    // zod驗證
    const result = formValueSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      setIsLoading(false);
      return;
    }

    // 清空之前的錯誤訊息
    setErrors({});

    try {
      if (type === "login") {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) {
          toastBox(res.error || "登入失敗", "error");
        } else {
          await router.push("/dashboard");
          toastBox("登入成功!", "success");
          if (setOpenModal) setOpenModal(null);
        }
      }

      if (type === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "登入失敗")
        }

        toastBox("註冊完成, 請重新登入", "success");
        if (setOpenModal) setOpenModal("login");

      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      toastBox("發生未知錯誤，請稍後再試", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (socialType: string) => {
    setIsLoading(true);
    try {
      const res = await signIn(socialType, {
        redirect: false,
        callbackUrl: "/dashboard",
      })
      if (res?.ok) {

        toastBox("登入成功!", "success");
        if (setOpenModal) setOpenModal(null);
      }
    } catch (error) {
      console.error("social login error:", error);
      toastBox("登入失敗!", "error");
    } finally {
      setIsLoading(false);
    }
  }
  const buttonClass = `p-2 border-2 w-full rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition`
  const titleClass = `mt-2 text-grey-600 text-3xl font-semibold`
  const socialButtonClass = `border-none text-white hover:opacity-70`
  return (
    <>
      <div className={className}>
        <div className="flex flex-col items-center justify-center mb-5">
          <Logo />
          {type === "login" && <h2 className={titleClass}>登入 ScoreNews </h2>}
          {type === "signup" && <h2 className={titleClass}>創建一個帳戶</h2>}
        </div>
        {type === "login" && <p className="text-sm text-center">還沒加入ScoreNews 嗎?
          <span
            className="text-red-600 cursor-pointer"
            onClick={setOpenModal
              ? () => setOpenModal("signup")
              : () => router.push('/signup')}> 註冊</span>
        </p>}
        {type === "signup" && <p className="text-sm text-center">已經加入ScoreNews 嗎?
          <span
            className="text-red-600 cursor-pointer"
            onClick={setOpenModal
              ? () => setOpenModal("login")
              : () => router.push('/login')}> 登入</span>
        </p>}
        <form ref={formRef} className="flex flex-col mt-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <Input
              name="email"
              type="text"
              placeholder="Email" className="mt-1"
              error={errors.email}
              defaultValue={type === "login" ? "test@test.com" : undefined}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              className="mt-2"
              error={errors.password}
              defaultValue={type === "login" ? "test1234" : undefined}
            />

          </div>
          {type === "login" &&
            <Button type="submit" className={`${buttonClass} mt-8 hover:opacity-70`} disabled={isLoading}>登入</Button>
          }
          {type === "signup" &&
            <Button type="submit" className={`${buttonClass} mt-8 hover:opacity-70`} disabled={isLoading}>註冊</Button>
          }
        </form>
        {type === "login" && (
          <div className="flex gap-2 mt-3">
            <Button
              className={`${buttonClass} ${socialButtonClass} bg-blue-500`}
              type="button"
              onClick={() => handleSocialLogin('facebook')}
            >FaceBook</Button>
            <Button
              className={`${buttonClass} ${socialButtonClass} bg-red-500`}
              type="button"
              onClick={() => handleSocialLogin('google')}
            >Google</Button>
            <Button
              className={`${buttonClass} ${socialButtonClass} bg-gray-600 `}
              type="button"
              onClick={() => handleSocialLogin('github')}
            >Github</Button>
          </div>
        )}
      </div >
    </>
  );
};

export default RegisterClient;