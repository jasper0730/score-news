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
            className="register-modal"
        >
            <RegisterForm
                type={type}
                setOpenModal={setOpenModal}
                className="register-modal__form"
            />
        </Modal>
    )
}

export default RegisterModal
