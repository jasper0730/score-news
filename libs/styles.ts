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

/**
 * 固定 header 下緣的收邊，取代原本的 1px 實線與 shadow。
 *
 * 三層疊起來才有「霧」的感覺，缺一層效果都會垮：
 * `backdrop-blur` 把捲到下面的內容糊掉、底色漸層補上一層由濃轉淡的頁面色、
 * mask 讓前兩者一起往下淡出。少了 mask 的話模糊會在收邊底部被硬生生切斷，
 * 反而多出一條比原本更明顯的邊。
 *
 * `-webkit-mask-image` 不能省：Safari 15.4 以前只認前綴版本，
 * 少了它在舊 Safari 上會是一塊沒淡出的模糊方塊。
 *
 * 用絕對定位掛在 header 外側（`top-full`），不佔版面高度，
 * 內容區既有的 `pt-nav` 讓位量不受影響。
 *
 * 起始透明度跟 header 自己的 `bg-background/95` 對齊。拉到全不透明的話，
 * 收邊會比它上面的 header 還實，交界處反而看得出一條分界。
 *
 * `-z-10` 是必要的，不是保險。收邊是定位元素，繪製順序排在「非定位的
 * in-flow 內容」之後，會蓋住從 header 垂下來、超出下緣的浮層——例如
 * 選項一多就會探出 header 的使用者選單。
 *
 * 那個選單自己有 `z-20` 也擋不住：首頁 header 的內層 bar 帶著
 * `backdrop-blur-md`，而 `backdrop-filter` 不論定位與否都會建立 stacking
 * context，選單的 z-index 被關在那層裡出不來。所以只能從收邊這側壓下去，
 * 把 z-index 開大是修不好的。
 *
 * 負值不會讓收邊掉到頁面內容後面：它被關在 header 自己的 stacking context
 * 裡（header 有 z-10），整層仍然浮在內文之上，只是排到同層內容的後面。
 */
export const HEADER_FADE_CLASSES =
    'pointer-events-none absolute inset-x-0 top-full -z-10 h-6 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-sm [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)] [mask-image:linear-gradient(to_bottom,black,transparent)]'

/** 品牌漸層文字（NewsScore 字樣） */
export const BRAND_TEXT_CLASSES =
    'bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-xl font-bold tracking-tight text-transparent'
