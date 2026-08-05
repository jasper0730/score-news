export const CALLBACK_URL = '/'

/**
 * 新聞列表每頁筆數。
 *
 * 必須放在這種「不帶 'use client'」的模組裡：從標記為 'use client' 的檔案
 * 匯出常數再於 server component 匯入，拿到的會是 client reference proxy
 * 而不是實際數值，傳給 MongoDB 的 limit() 會直接拋
 * MongoInvalidArgumentError。
 */
export const NEWS_PAGE_SIZE = 12
