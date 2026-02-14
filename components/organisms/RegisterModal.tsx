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
            className="w-full max-w-lg p-2 relative bg-white dark:bg-gray-900 rounded-lg shadow-lg"
        >
            <RegisterForm
                type={type}
                setOpenModal={setOpenModal}
                className="px-12 pt-6 pb-10 z-10"
            />
        </Modal>
    )
}

export default RegisterModal
