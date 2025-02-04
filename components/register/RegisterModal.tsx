"use client"
import RegisterClient from "./RegisterClient";
import Modal from "../Modal";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
  type: "login" | "signup";
  setOpenModal?: (type: "login" | "signup" | null) => void;
}
const RegisterModal = ({ open, onClose, type, setOpenModal }: RegisterModalProps) => {
  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg p-2 relative bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <RegisterClient
        type={type}
        setOpenModal={setOpenModal}
        className="px-12 pt-6 pb-10 z-10" />
    </Modal>
  );
}

export default RegisterModal;