import { toast } from 'react-hot-toast'
import { cn } from '@/libs/cn'
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
            className={cn(
                'pointer-events-auto flex max-w-60 items-center justify-center gap-2 rounded-lg bg-surface px-4 py-2 shadow-lg ring-1 ring-black/5',
                t.visible ? 'animate-enter' : 'animate-leave'
            )}
        >
            {emoji && <div>{emoji}</div>}
            <div className="flex-1 text-center">{text}</div>
        </div>
    ))
}
