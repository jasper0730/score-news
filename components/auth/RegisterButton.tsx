"use client"
import { useState } from "react";
import { RiLoginBoxLine, RiLogoutBoxLine } from "react-icons/ri";
import RegisterModal from "./RegisterModal";
import { AnimatePresence } from "motion/react"
import { signOut } from "next-auth/react";

const RegisterButton = ({ type }: { type: string }) => {
  const [openModal, setOpenModal] = useState<"login" | "signup" | null>(null)
  const handleLoginOpen = () => {
    setOpenModal("login");
  }

  const handleLoginClose = () => {
    setOpenModal(null);
  }
  const classes = `flex gap-1 cursor-pointer  items-center hover:opacity-70 duration-300`
  return (
    <>
      {type === "logout" && (
        <div
          className={classes}
          onClick={() => signOut({ callbackUrl: '/' })}>
          <RiLogoutBoxLine size={'1rem'} />
          <p>登出</p>
        </div>
      )}
      {type === "login" && (
        <>
          <div
            className={classes}
            onClick={handleLoginOpen}>
            <RiLoginBoxLine size={'1rem'} />
            <p>登入</p>
          </div>
          <AnimatePresence>
            {openModal === "login" && <RegisterModal open={openModal === "login"} onClose={handleLoginClose} type="login" setOpenModal={setOpenModal} />}
          </AnimatePresence>
          <AnimatePresence>
            {openModal === "signup" && <RegisterModal open={openModal === "signup"} onClose={handleLoginClose} type="signup" setOpenModal={setOpenModal} />}
          </AnimatePresence></>
      )}
    </>);
};

export default RegisterButton;