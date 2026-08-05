'use client'

import RegisterForm from '@/components/organisms/RegisterForm'
import Modal from '@/components/molecules/Modal'
import type { AuthFormType } from '@/types/news'

interface RegisterModalProps {
    open: boolean
    onClose: () => void
    type: AuthFormType
    setOpenModal?: (type: AuthFormType | null) => void
}

const RegisterModal = ({ open, onClose, type, setOpenModal }: RegisterModalProps) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            className="w-full max-w-lg rounded-lg bg-surface p-2 shadow-lg"
        >
            <RegisterForm
                type={type}
                setOpenModal={setOpenModal}
                className="px-6 pb-10 pt-6 sm:px-12"
            />
        </Modal>
    )
}

export default RegisterModal
