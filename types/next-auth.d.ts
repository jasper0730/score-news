import type { DefaultSession } from 'next-auth'

/**
 * next-auth 預設的 session.user 只有 name / email / image。
 * 本專案的評論功能需要比對使用者 id，因此在 options.ts 的 session callback
 * 中從 token.sub 補上，這裡同步擴充型別。
 *
 * 沿用 DefaultSession['user'] 的風格宣告為選擇性：token 理論上必然帶有 sub，
 * 但那是 next-auth 的執行期保證而非型別保證，不在這裡假裝它一定存在。
 */
declare module 'next-auth' {
    interface Session {
        user: {
            id?: string
        } & DefaultSession['user']
    }
}
