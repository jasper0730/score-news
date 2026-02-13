import { toast } from 'react-hot-toast'
import type { ToastState } from '@/types/news'

const EMOJI_MAP: Record<ToastState, string> = {
    success: '👌',
    error: '❌',
    warning: '⚠️',
}

export const toastBox = (text: string, state: ToastState) => {
    const emoji = EMOJI_MAP[state]

    toast.dismiss()
    toast.custom((t) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-60 px-4 py-2 bg-white dark:bg-black shadow-lg rounded-lg pointer-events-auto flex gap-2 items-center justify-center ring-1 ring-black ring-opacity-5`}
        >
            {emoji && <div>{emoji}</div>}
            <div className="flex-1 text-center">{text}</div>
        </div>
    ))
}
