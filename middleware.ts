import { NextResponse } from 'next/server'

// 目前沒有任何實際邏輯，僅放行。若確定不需要，整個檔案可以刪除
// —— matcher 幾乎涵蓋所有路徑，等於每個 request 都多跑一次沒有作用的函式。
export function middleware() {
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
