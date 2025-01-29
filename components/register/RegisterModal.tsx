"use client"
import RegisterClient from "./RegisterClient";
import Modal from "../modal/Modal";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  type: "login" | "signup";
  setOpenModal?: (type: "login" | "signup" | null) => void;
}
const RegisterModal = ({ open, onClose, type, setOpenModal }: RegisterModalProps) => {
  return (
    <Modal open={open} onClose={onClose} className="rounded-xl  w-full max-w-lg p-2">
      <RegisterClient
        type={type}
        setOpenModal={setOpenModal}
        className="px-12 pt-6 pb-10 shadow-[0_4px_4px_4px_rgba(0,0,0,0.1)] rounded-md z-10" />
    </Modal>
  );
}

export default RegisterModal;