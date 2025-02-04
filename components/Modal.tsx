"use client"
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react"

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
}
const Modal = ({
  children,
  open,
  className = '',
  onClose
}: ModalProps) => {

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    }
  }, [open]);

  return (
    createPortal(
      <>
        <dialog
          ref={dialogRef}
          className={`modal overflow-hidden bg-transparent focus:outline-none ${className}`}
          onClose={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="top-0 left-0 w-full h-[100dvh] fixed"
            onClick={onClose}>
          </motion.div>
          <motion.div
            className="z-10 relative bg-white dark:bg-black"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {children}
          </motion.div>
        </dialog>
      </>,
      document.body
    )
  )
}






export default Modal;