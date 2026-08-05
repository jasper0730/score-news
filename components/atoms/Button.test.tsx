import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@/components/atoms/Button'

describe('Button', () => {
    it('渲染文字內容', () => {
        render(<Button>送出</Button>)

        expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
    })

    it('預設 type 是 button，避免在表單裡意外觸發送出', () => {
        render(<Button>送出</Button>)

        expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('可以指定為 submit', () => {
        render(<Button type="submit">送出</Button>)

        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('點擊時觸發 onClick', async () => {
        const onClick = vi.fn()
        render(<Button onClick={onClick}>送出</Button>)

        await userEvent.click(screen.getByRole('button'))

        expect(onClick).toHaveBeenCalledOnce()
    })

    it('disabled 時不觸發 onClick', async () => {
        const onClick = vi.fn()
        render(
            <Button onClick={onClick} disabled>
                送出
            </Button>
        )

        await userEvent.click(screen.getByRole('button'))

        expect(onClick).not.toHaveBeenCalled()
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('外部傳入的 className 會覆蓋掉衝突的內建樣式', () => {
        render(<Button className="px-10">送出</Button>)

        // size=md 的 px-4 應該被蓋掉，而不是兩個同時存在
        const className = screen.getByRole('button').className
        expect(className).toContain('px-10')
        expect(className).not.toContain('px-4')
    })

    it('fullWidth 時加上 w-full', () => {
        render(<Button fullWidth>送出</Button>)

        expect(screen.getByRole('button')).toHaveClass('w-full')
    })

    it('渲染 icon', () => {
        render(<Button icon={<span data-testid="icon" />}>送出</Button>)

        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('把其餘的 HTML 屬性透傳下去', () => {
        render(<Button aria-label="關閉視窗">×</Button>)

        expect(screen.getByRole('button', { name: '關閉視窗' })).toBeInTheDocument()
    })
})
