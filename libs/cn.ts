import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 組合 class 字串，並讓後面的 Tailwind class 覆蓋前面衝突的同類 class。
 * 例如 cn('px-4 py-2', 'px-6') -> 'py-2 px-6'
 *
 * 元件對外開放 className 時一律用它，否則 `${base} ${className}` 只會讓兩個
 * 衝突的 class 同時存在，最後由 CSS 檔案順序決定勝負（無法預期）。
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
