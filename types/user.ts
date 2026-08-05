/**
 * 前端可見的使用者資料。
 *
 * 刻意不含 password、_id 等 document 內部欄位：這個型別的值會被
 * app/(other)/layout.tsx 當作 prop 傳給 client component，
 * 也就是會序列化進 RSC payload 送到瀏覽器。
 * 資料庫端的完整結構請用 libs/db.ts 的 UserDocument。
 */
export interface UserType {
    id: string
    name?: string
    email?: string
    image?: string
    nickname?: string
    bio?: string
}
