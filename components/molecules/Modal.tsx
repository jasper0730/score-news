'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

interface ModalProps {
    open: boolean
    onClose: () => void
    children?: React.ReactNode
    className?: string
}

const Modal = ({ children, open, className = '', onClose }: ModalProps) => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        document.body.style.overflow = open ? 'hidden' : ''

        return () => {
            document.body.style.overflow = ''
        }
    }, [open, mounted])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal__overlay"
                    onClick={onClose}
                >
                    <motion.div
                        className={`modal__content ${className}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default Modal
