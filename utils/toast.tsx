import { toast } from 'react-hot-toast'

export const toastBox = (text: string, state: string) => {
    let emoji: string
    switch (state) {
        case 'success':
            emoji = '👌'
            break
        case 'error':
            emoji = '❌'
            break
        case 'warning':
            emoji = '⚠️'
            break
        default:
            break
    }
    toast.dismiss()
    toast.custom((t: React.ComponentProps<typeof toast>) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            }  max-w-60 px-4 py-2 bg-white dark:bg-black shadow-lg rounded-lg pointer-events-auto flex gap-2 items-center justify-center ring-1 ring-black ring-opacity-5`}
        >
            {emoji && <div>{emoji}</div>}
            <div className="flex-1 text-center">{text}</div>
        </div>
    ))
}
