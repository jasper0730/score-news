/**
 * 台灣新聞媒體的 RSS 來源清單。
 *
 * 全部來自各媒體公開提供的 RSS 服務，只取標題與摘要並連回原站，不抓全文。
 * 清單經實測（2026-08-06）：中時、TVBS、三立、風傳媒、NowNews、華視、鏡週刊
 * 皆已不再提供 RSS，關鍵評論網會擋機器人，因此不在清單內。
 */

/** 圖片的取得方式，決定 ingestion 要不要為了補圖多打一次文章頁 */
export type ImageSource =
    /** feed 本身就有圖（enclosure / media:* / <image>） */
    | 'feed'
    /** 圖片內嵌在 description 的 <img> 裡 */
    | 'description'
    /** feed 沒有圖，需要抓文章頁的 og:image */
    | 'page'

export interface FeedSource {
    /** 媒體代號，會併入 article_id 的雜湊，避免不同媒體的 guid 撞號 */
    outlet: string
    /** 顯示用的媒體名稱，對應 NewsDocument.source_name */
    outletName: string
    /** 媒體首頁，對應 NewsDocument.source_url */
    siteUrl: string
    /** 媒體 icon，對應 NewsDocument.source_icon */
    iconUrl: string
    category: string
    url: string
    imageSource: ImageSource
}

type OutletMeta = Omit<FeedSource, 'category' | 'url' | 'imageSource'>

const OUTLETS = {
    cna: {
        outlet: 'cna',
        outletName: '中央社',
        siteUrl: 'https://www.cna.com.tw',
        iconUrl: 'https://www.cna.com.tw/favicon.ico',
    },
    udn: {
        outlet: 'udn',
        outletName: '聯合新聞網',
        siteUrl: 'https://udn.com',
        iconUrl: 'https://udn.com/favicon.ico',
    },
    ettoday: {
        outlet: 'ettoday',
        outletName: 'ETtoday新聞雲',
        siteUrl: 'https://www.ettoday.net',
        iconUrl: 'https://www.ettoday.net/favicon.ico',
    },
    ltn: {
        outlet: 'ltn',
        outletName: '自由時報',
        siteUrl: 'https://news.ltn.com.tw',
        iconUrl: 'https://news.ltn.com.tw/favicon.ico',
    },
    newtalk: {
        outlet: 'newtalk',
        outletName: '新頭殼',
        siteUrl: 'https://newtalk.tw',
        iconUrl: 'https://newtalk.tw/favicon.ico',
    },
    twreporter: {
        outlet: 'twreporter',
        outletName: '報導者',
        siteUrl: 'https://www.twreporter.org',
        iconUrl: 'https://www.twreporter.org/favicon.ico',
    },
    pts: {
        outlet: 'pts',
        outletName: '公視新聞',
        siteUrl: 'https://news.pts.org.tw',
        iconUrl: 'https://news.pts.org.tw/favicon.ico',
    },
} satisfies Record<string, OutletMeta>

function feeds(
    meta: OutletMeta,
    imageSource: ImageSource,
    entries: [category: string, url: string][]
): FeedSource[] {
    return entries.map(([category, url]) => ({ ...meta, category, url, imageSource }))
}

const cnaFeed = (slug: string) => `https://feeds.feedburner.com/rsscna/${slug}`
const ltnFeed = (slug: string) => `https://news.ltn.com.tw/rss/${slug}.xml`
const ettodayFeed = (slug: string) => `https://feeds.feedburner.com/ettoday/${slug}`

export const FEED_SOURCES: FeedSource[] = [
    // 中央社：通訊社，內容中性、guid 穩定，是清單裡品質最整齊的來源
    ...feeds(OUTLETS.cna, 'page', [
        ['政治', cnaFeed('politics')],
        ['國際', cnaFeed('intworld')],
        ['兩岸', cnaFeed('mainland')],
        ['產經', cnaFeed('finance')],
        ['科技', cnaFeed('technology')],
        ['生活', cnaFeed('lifehealth')],
        ['社會', cnaFeed('social')],
        ['地方', cnaFeed('local')],
        ['文化', cnaFeed('culture')],
        ['運動', cnaFeed('sport')],
        ['娛樂', cnaFeed('stars')],
    ]),

    // 聯合：單一 feed 但一次給 90+ 則，且欄位最完整（自帶 <image> 與 <category>）
    ...feeds(OUTLETS.udn, 'feed', [['要聞', 'https://udn.com/news/rssfeed']]),

    // ETtoday：圖片內嵌在 description 的 <img>
    // 刻意略過開運、直銷雲、時尚、推薦圖集等偏推廣性質的分類
    ...feeds(OUTLETS.ettoday, 'description', [
        ['即時', ettodayFeed('realtime')],
        ['政治', ettodayFeed('news')],
        ['國際', ettodayFeed('global')],
        ['大陸', ettodayFeed('china')],
        ['財經', ettodayFeed('finance')],
        ['社會', ettodayFeed('society')],
        ['生活', ettodayFeed('lifestyle')],
        ['健康', ettodayFeed('health')],
        ['地方', ettodayFeed('local')],
        ['體育', ettodayFeed('sport')],
        ['影劇', ettodayFeed('star')],
        ['3C', ettodayFeed('teck3c')],
        ['軍武', ettodayFeed('army')],
        ['法律', ettodayFeed('law')],
        ['房產', ettodayFeed('house')],
        ['旅遊', ettodayFeed('travel')],
        ['遊戲', ettodayFeed('game')],
    ]),

    // 自由時報：唯一沒有 guid 的來源，article_id 得靠 link 雜湊
    ...feeds(OUTLETS.ltn, 'page', [
        ['即時', ltnFeed('all')],
        ['政治', ltnFeed('politics')],
        ['社會', ltnFeed('society')],
        ['生活', ltnFeed('life')],
        ['國際', ltnFeed('world')],
        ['財經', ltnFeed('business')],
        ['體育', ltnFeed('sports')],
        ['娛樂', ltnFeed('entertainment')],
        ['藝文', ltnFeed('art')],
        ['軍武', ltnFeed('def')],
        ['地方', ltnFeed('local')],
    ]),

    ...feeds(OUTLETS.newtalk, 'feed', [['全部', 'https://newtalk.tw/rss/all']]),

    // 報導者：深度調查報導，更新頻率低但內容品質高
    ...feeds(OUTLETS.twreporter, 'feed', [['深度報導', 'https://www.twreporter.org/a/rss2.xml']]),

    // 公視：清單裡唯一的 Atom 格式
    ...feeds(OUTLETS.pts, 'page', [['新聞', 'https://about.pts.org.tw/rss/XML/newsfeed.xml']]),
]

/** 需要額外抓文章頁補圖的來源，ingestion 用它估算請求量 */
export const PAGE_IMAGE_SOURCES = FEED_SOURCES.filter((s) => s.imageSource === 'page')
