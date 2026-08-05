import { describe, expect, it } from 'vitest'
import { cn } from '@/libs/cn'

describe('cn', () => {
    it('合併多個 class 字串', () => {
        expect(cn('flex', 'items-center')).toBe('flex items-center')
    })

    it('後面的 Tailwind class 覆蓋前面同類的 class', () => {
        // 這是 cn 存在的理由：單純字串相接會讓 px-4 與 px-6 同時留著
        expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6')
    })

    it('忽略 falsy 值，讓條件式 class 可以直接內嵌', () => {
        expect(cn('base', false && 'hidden', undefined, null, '')).toBe('base')
    })

    it('支援陣列與物件形式的條件 class', () => {
        expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
    })

    it('沒有任何輸入時回傳空字串', () => {
        expect(cn()).toBe('')
    })
})
