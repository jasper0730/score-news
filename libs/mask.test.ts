import { describe, expect, it } from 'vitest'
import { maskEmail } from '@/libs/mask'

describe('maskEmail', () => {
    it.each([
        ['wilson0730@gmail.com', 'w***0@gmail.com'],
        ['a@example.com', 'a***@example.com'],
        ['ab@example.com', 'a***@example.com'],
        ['abc@example.com', 'a***c@example.com'],
        ['ming.wang+news@mail.example.co.uk', 'm***s@mail.example.co.uk'],
    ])('%s → %s', (input, expected) => {
        expect(maskEmail(input)).toBe(expected)
    })

    it.each([['阿明'], ['小明 wang'], ['匿名用戶'], [''], ['not-an-email'], ['@example.com']])(
        '不是 email 的顯示名稱不動它：%s',
        (input) => {
            expect(maskEmail(input)).toBe(input)
        }
    )

    it('星號數量固定，不洩漏信箱長度', () => {
        const short = maskEmail('abc@x.com')
        const long = maskEmail('averyveryverylongaddress@x.com')

        expect(short).toBe('a***c@x.com')
        expect(long).toBe('a***s@x.com')
    })
})
