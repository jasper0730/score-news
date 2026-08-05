import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from '@/components/atoms/Input'

describe('Input', () => {
    it('預設 type 為 text', () => {
        render(<Input placeholder="Email" />)

        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'text')
    })

    it('可以輸入文字', async () => {
        render(<Input placeholder="Email" />)
        const input = screen.getByPlaceholderText('Email')

        await userEvent.type(input, 'ming@example.com')

        expect(input).toHaveValue('ming@example.com')
    })

    it('沒有錯誤時不顯示錯誤訊息，也不標記 aria-invalid', () => {
        render(<Input placeholder="Email" />)

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).not.toHaveAttribute('aria-invalid')
    })

    it('有錯誤時以 role=alert 顯示，讓螢幕閱讀器讀得到', () => {
        render(<Input placeholder="Email" error="請輸入正確的 Email" />)

        expect(screen.getByRole('alert')).toHaveTextContent('請輸入正確的 Email')
    })

    it('錯誤訊息透過 aria-describedby 與輸入框關聯', () => {
        render(<Input placeholder="Email" error="請輸入正確的 Email" />)

        const input = screen.getByPlaceholderText('Email')
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
    })

    it('沒有給 id 時會自動產生，多個 Input 之間不會撞號', () => {
        render(
            <>
                <Input placeholder="Email" error="錯誤 A" />
                <Input placeholder="Password" error="錯誤 B" />
            </>
        )

        const [first, second] = screen.getAllByRole('alert')
        expect(first?.id).not.toBe(second?.id)
    })

    it('可以指定 id', () => {
        render(<Input id="email-field" placeholder="Email" error="錯誤" />)

        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('id', 'email-field')
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'email-field-error')
    })

    it('inputRef 指向實際的 input 元素', () => {
        const ref = createRef<HTMLInputElement>()
        render(<Input inputRef={ref} placeholder="Email" />)

        expect(ref.current).toBe(screen.getByPlaceholderText('Email'))
    })
})
