/**
 * 跨元件共用的 class 組合。
 *
 * 只放「同一份樣式出現在兩個以上的檔案」的情況，避免各處各抄一份導致樣式漂移。
 * 單一元件自己的樣式請直接寫在該元件裡，不要放進來。
 */

/** 輸入類元件（input / textarea）的共同外觀 */
export const FIELD_CLASSES =
    'w-full rounded-lg border-2 border-input bg-transparent p-3 transition duration-300 focus:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70'

/** 卡片／留言區塊等次要區塊的表面樣式 */
export const CARD_CLASSES = 'rounded-lg border bg-card p-4'

/** 新聞列表的 responsive grid，首頁與後台收藏頁共用 */
export const NEWS_GRID_CLASSES = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/** 品牌漸層文字（NewsScore 字樣） */
export const BRAND_TEXT_CLASSES =
    'bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-xl font-bold tracking-tight text-transparent'
