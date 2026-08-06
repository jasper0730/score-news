import type { NextConfig } from 'next'

/**
 * 新聞圖片全部是外連各媒體的 CDN。
 *
 * 用萬用子網域而非寫死主機名：各家 CDN 常有 cdn1／cdn2／cdn3 或
 * pgw／uc 這類輪替，寫死其中一個，換到別台就整批破圖。
 * 實測（2026-08-06）各家實際用到的主機列在註解裡。
 */
const NEWS_IMAGE_HOSTS = [
    '**.cna.com.tw', // imgcdn.cna.com.tw
    '**.udn.com.tw', // pgw.udn.com.tw、uc.udn.com.tw
    '**.ettoday.net', // cdn2.ettoday.net
    '**.ltn.com.tw', // img.ltn.com.tw
    '**.newtalk.tw', // images.newtalk.tw
    '**.twreporter.org', // www.twreporter.org
    '**.pts.org.tw', // news-data.pts.org.tw
]

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        // 圖片來自各媒體 CDN，本身已經壓縮過；轉交 Vercel 最佳化會產生
        // 可觀的轉換費用，效益卻有限，因此維持不最佳化直接外連。
        // 註：unoptimized 為 true 時 remotePatterns 不會被強制檢查，
        // 這裡仍然列出，是為了日後若改回最佳化不會整批破圖。
        unoptimized: true,
        remotePatterns: NEWS_IMAGE_HOSTS.map((hostname) => ({
            protocol: 'https' as const,
            hostname,
        })),
    },
}

export default nextConfig
