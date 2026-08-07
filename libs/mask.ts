const EMAIL_PATTERN = /^([^\s@]+)@([^\s@]+\.[^\s@]+)$/

/**
 * 把 email 形式的字串脫敏，例如 `wilson0730@gmail.com` → `w***0@gmail.com`；
 * 不是 email 就原樣回傳。
 *
 * 留言的 userName 在寫入時就已決定：暱稱 → name → email → 匿名用戶。
 * 沒設暱稱也沒有 name 的使用者（帳密註冊最常見）會落到 email，
 * 而留言區是完全公開的，等於把信箱攤在所有人面前。
 *
 * 判斷放在讀取端而不是寫入端，是因為資料庫裡早就存了一批未脫敏的
 * userName；只改寫入的話那些舊留言永遠不會被修掉。
 *
 * 保留頭尾各一個字元讓本人認得出是自己，中間一律固定三顆星——
 * 不隨長度變動，否則星號數量就洩漏了信箱長度。
 * 網域保持原樣：它本身不足以識別個人，留著才看得出來這是個信箱。
 */
export function maskEmail(value: string): string {
    const match = EMAIL_PATTERN.exec(value)
    if (!match) return value

    const [, local = '', domain = ''] = match
    const head = local.slice(0, 1)
    // 只有兩個字元時再露出尾字等於整段沒遮到，這種情況只保留頭
    const tail = local.length > 2 ? local.slice(-1) : ''

    return `${head}***${tail}@${domain}`
}
