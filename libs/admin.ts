/**
 * 管理員判定。
 *
 * 目前用環境變數 ADMIN_EMAILS（逗號分隔）而不是資料庫欄位，
 * 理由是把權限留在資料平面之外：連線字串外流時，攻擊者仍然無法把自己
 * 改成管理員——他還需要拿到部署權限這一道獨立的關卡。
 *
 * 代價是換人要重新部署。以目前只有一位管理員的規模，這是可接受的取捨。
 *
 * ⚠️ 因為 /api/signup 沒有驗證 Email 所有權，把某個 Email 加進這份清單前
 * 務必先用它註冊完帳號，否則等於留下一個「無主的管理員身分」讓人認領。
 *
 * 日後若要改成 UserDocument.role，只需要改這個函式與它的測試——
 * 呼叫端一律經過這裡，不直接讀環境變數。
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false

    const allowlist = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)

    return allowlist.includes(email.trim().toLowerCase())
}
