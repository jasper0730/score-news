# Score News — 面試講解筆記

給前端工程師面試用。每個段落都附「為什麼這樣做」與「面試官可能的追問」，
因為面試真正在意的是決策過程，不是技術清單。

**所有數字都是實測值**（2026-08-07），不要用推估的講。

---

## 目錄

1. [一分鐘定位](#1-一分鐘定位)
2. [系統全貌](#2-系統全貌)
3. [資料從哪來](#3-資料從哪來)
4. [資料會一直更新嗎](#4-資料會一直更新嗎)
5. [有歷史紀錄嗎](#5-有歷史紀錄嗎)
6. [前端技術深入](#6-前端技術深入)
7. [後端／資料層深入](#7-後端資料層深入)
8. [測試策略](#8-測試策略)
9. [已知限制與下一步](#9-已知限制與下一步)
10. [面試問答演練](#10-面試問答演練)

---

## 1. 一分鐘定位

> 「Score News 是一個新聞評分平台——讀者可以對新聞評分、收藏、留言。
> 技術上是 Next.js 16 App Router + TypeScript，資料層用 Server Actions 直接接
> MongoDB，沒有獨立後端。
>
> 它原本是練習專案，後來我用正式產品的標準重做了一輪：把新聞列表從
> 『一次撈一千筆到瀏覽器再前端過濾』改成伺服器端分頁、補上 451 個測試、
> 修掉幾個 React Server Components 序列化邊界的安全性問題。
> 最近自建了新聞資料源，改用台灣 7 家媒體的 RSS 做擷取管線。」

**這段的設計**：丟出三個鉤子（效能、測試、RSC 邊界）讓對方挑一個深入。
不要一次講完，讓對方主導追問方向，你才知道他在意什麼。

---

## 2. 系統全貌

```
┌─────────────────────────────────────────────────────────┐
│  瀏覽器                                                  │
│  ├─ Server Components（首頁、後台）── 取初始資料         │
│  └─ Client Components ── 互動後直接呼叫 Server Actions   │
└──────────────────┬──────────────────────────────────────┘
                   │ RSC payload / Server Action 呼叫
┌──────────────────▼──────────────────────────────────────┐
│  Next.js（Vercel）                                       │
│  ├─ actions/      Server Actions ── 唯一碰資料庫的地方   │
│  ├─ libs/auth     NextAuth v4（JWT）                     │
│  └─ app/api/      4 個 route handler                     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  MongoDB Atlas                                           │
│  news / ratings / comments / favorites / users           │
└──────────────────▲──────────────────────────────────────┘
                   │ 每小時 upsert
┌──────────────────┴──────────────────────────────────────┐
│  GitHub Actions（排程）                                  │
│  └─ scripts/ingestNews.ts ── 抓 43 個 RSS feed           │
└─────────────────────────────────────────────────────────┘
```

**值得強調的一句話**：整個系統只有一個 codebase，沒有前後端分離。
Server Actions 讓資料層跟 UI 寫在一起，比較接近 **BFF（Backend for Frontend）**
而不是傳統三層架構。

---

## 3. 資料從哪來

### 3.1 為什麼是 RSS 而不是 News API

原本用 **NewsData.io** 的免費 API，但免費層的每日請求數與筆數都撐不起正式站。
市面上的新聞 API 幾乎都是同樣的商業模式：免費層只夠 demo。

**轉折點是意識到「我要的不是 API，是 RSS」。**
台灣主要媒體都免費提供 RSS，那是他們**主動公開**的訂閱格式，沒有配額限制。

### 3.2 實際的來源清單（實測 2026-08-06）

| 媒體           | feed 數 | 單次則數 | 圖片來源                 | 穩定 ID                       |
| -------------- | ------: | -------: | ------------------------ | ----------------------------- |
| ETtoday        |      17 |      850 | description 內嵌 `<img>` | guid = URL                    |
| 中央社 CNA     |      11 |      220 | 需抓 og:image            | `CNA/2026-08-06/202608060028` |
| 自由時報 LTN   |      11 |      440 | 需抓 og:image            | **無 → 用連結末端的文章編號** |
| 聯合 UDN       |       1 |       93 | feed 自帶 `<image>`      | guid = URL                    |
| 新頭殼 Newtalk |       1 |      100 | `media:content`          | guid = URL                    |
| 公視 PTS       |       1 |       25 | 需抓 og:image            | `<id>` = URL（**Atom 格式**） |
| 報導者         |       1 |       10 | `enclosure`              | guid = URL                    |

**合計 43 個 feed、單次約 1740 則，去重後 1610 篇。**

我也實測確認 **中時、TVBS、三立、風傳媒、NowNews、華視、鏡週刊已不再提供 RSS**
（首頁沒有 RSS autodiscovery，猜測的網址全是 404），關鍵評論網會擋機器人（403）。
所以這 7 家已經是台灣免費 RSS 的完整範圍。

> 💡 **講故事的細節**：一開始我猜 UDN 的 feed 網址，抓到的 `pubDate` 全是
> `Thu, 01 Jan 1970`（epoch 0）。後來改用 **RSS autodiscovery**——讀首頁的
> `<link rel="alternate" type="application/rss+xml">`——才找到官方的正確網址，
> 而且那個 feed 欄位最完整，連 `<category>` 和 `<author>` 都有。
> 這說明**猜網址不如讓標準告訴你**。

### 3.3 只存摘要，不抓全文

這是**刻意的設計，不是偷懶**：

- RSS 只給標題與摘要，全文要另外爬文章頁
- 爬全文轉載是明確的版權風險
- **只取摘要並導流回原站，對媒體是有利的**（Google News 模式）

前端在 `content` 為空時會顯示 `description` 並附「閱讀完整原文 →」連結。

> ⚠️ **追問：「這樣算不算爬蟲？有法律問題嗎？」**
> RSS 是媒體主動提供的訂閱格式，讀它跟用 RSS 閱讀器沒有差別。
> 我唯一「爬」的是文章頁的 `og:image` meta 標籤——那是 OpenGraph 協定
> 專門設計給第三方讀取的，Facebook、LINE 分享時做的是同一件事。
> 而且我帶了可識別的 User-Agent，沒有偽裝成瀏覽器。

### 3.4 最深的一個設計：`article_id`

**問題**：`ratings`、`comments`、`favorites` 全都以 `article_id` 關聯新聞。
如果同一篇文章在不同次抓取拿到不同的 id，使用者的評分和留言就會**變成孤兒資料**
——不會報錯，只是從畫面上消失。

**規則**：

```ts
export function buildArticleId(
    source: Pick<FeedSource, 'outlet' | 'linkIdPattern'>,
    item: Pick<FeedItem, 'guid' | 'link'>
): string {
    const seed = item.guid ?? extractLinkId(item.link, source.linkIdPattern) ?? item.link
    return createHash('sha1').update(`${source.outlet}:${seed}`).digest('hex')
}
```

三個決策，每個都有理由：

1. **只用 guid／連結當種子**，不摻時間、亂數、抓取順序 → 保證可重現
2. **不用標題當種子** → 媒體改標題時不會變成「新文章」
3. **加上 outlet 前綴** → 不同媒體剛好用同一組 guid 也不會撞號

**自由時報是唯一沒有 guid 的來源，而且它踩到一個真實的坑。**

上線後我在畫面上看到同一則新聞並排出現兩次。查了才發現它把同一篇掛在
多個分類路徑下，文章編號相同但網址不同：

```
https://news.ltn.com.tw/news/politics/breakingnews/5530552
https://news.ltn.com.tw/news/Tainan/breakingnews/5530552
                  ↑ 分類不同，編號 5530552 相同
```

用完整連結雜湊就把同一篇算成兩篇。實測 2195 篇裡有 **87 組重複，佔 4.0%**。

修法是讓來源設定可以帶一個「從連結萃取識別碼」的樣式，種子的優先順序改為
`guid → 萃取出的編號 → 完整連結`。修完重灌後**重複率降到 0.06%**，
唯一殘留的那組是新頭殼自己發了兩篇不同編號的同標題文章，不是我們的問題。

> 💡 **這裡有個值得講的 API 設計決定**：`buildArticleId` 我刻意改成收整個
> source 物件而不是 outlet 字串。因為少傳一個參數就會悄悄退回用完整連結、
> 重新製造出重複文章，而且不會有任何錯誤訊息——**用型別擋住比靠記得傳可靠**。

> ⚠️ **追問：「那如果媒體改了文章網址呢？」**
> 自由時報只要文章編號不變就不受影響，其他六家有 guid 也不受影響。
> 真正會斷的是「編號也換掉」的情況，那就沒辦法了。
> 這條規則我在專案文件裡標記為「一旦上線就不能改」，
> 這次是趁使用者資料還是 0 筆的時候做的最後一次變更。

### 3.5 圖片：分層策略省掉一半以上的請求

RSS 規格沒有強制圖片欄位，各家做法都不同。我實測後分成四層：

```
feed 自帶（enclosure / media:content / <image>）
  ↓ 沒有
description 內嵌的 <img>
  ↓ 沒有
文章頁的 og:image（額外一次 HTTP 請求）
  ↓ 取不到
預設圖
```

**成果**：聯合、ETtoday、報導者 100% 自帶圖，新頭殼 95%，
只有中央社、自由時報、公視需要額外抓頁面。全量匯入 1610 篇只打了 601 次請求，
**比「每篇都抓」少了 63%**。最終有真實圖片的比例是 99.6%。

補圖時只讀 HTTP 回應的**前 64KB 就中止連線**：

```ts
while (html.length < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
    if (html.includes('</head>')) break // og:image 一定在 head 裡
}
```

新聞頁動輒數百 KB，為了一個 meta 標籤拉完整頁，601 篇就是上百 MB 的無謂流量。

### 3.6 實測資料揪出的兩個真實缺陷

寫測試時我堅持用**真的 feed 存成 fixture**，立刻抓到兩個憑空想像不會發現的問題：

**（1）新頭殼的圖片網址是壞的**

```
http:https://images.newtalk.tw/album/news/1051/xxx.jpg
```

多了一段假協定。直接丟給 `new URL()` 會解析成 `protocol=http` +
`pathname=https://...`，得到一個永遠載不到的網址。

**（2）中文標題的全形空格被壓掉**

我的 `stripHtml` 用 `\s+` 壓縮空白，但 **JS 的 `\s` 涵蓋全形空格 U+3000**。
中文新聞標題常拿它當分隔符：

```
9艘共艦6架次共機擾台　國軍嚴密監控
                    ↑ 這是 U+3000，不是多餘空白
```

改成 `[ \t\n\r\f\v]+` 只壓半形。

> 💡 **這兩個是很好的面試材料**，因為它們證明「用真實資料測試」不是教條，
> 而是真的會抓到 bug。第二個尤其能展現你對中文情境的敏感度。

---

## 4. 資料會一直更新嗎

**會，GitHub Actions 每小時抓一次。**

```yaml
on:
    schedule:
        - cron: '5 * * * *' # 每小時第 5 分
```

### 4.1 為什麼是 GitHub Actions 而不是 Vercel Cron

網站部署在 Vercel，直覺會用 Vercel Cron，但：

|          | Vercel Cron（免費） | GitHub Actions |
| -------- | ------------------- | -------------- |
| 頻率     | **每天只能一次**    | 每小時可行     |
| 執行時間 | 受函式上限          | 可設 20 分鐘   |
| 成本     | 佔用函式額度        | 公開 repo 免費 |

新聞站每天更新一次沒有意義，所以選 Actions。

### 4.2 幾個實作細節

- **排在第 5 分而非整點**：整點是 GitHub Actions 的排程尖峰，免費 runner 排隊延遲明顯
- **`concurrency` group**：前一次沒跑完就不再開一個。upsert 本身可重入，但同時跑只會重複打各媒體的站台
- **每週一次 feed 健康檢查**：ingestion 的設計是單一來源失敗就跳過繼續跑（穩定性上是對的），但這代表某家默默失效不會有人發現。`checkFeeds.ts` 只讀不寫，來源掛掉時讓 GitHub 寄通知

### 4.3 增量設計：53 秒 → 23 秒

**全量匯入**（資料庫空的，1610 篇全新）：

```
抓取完成：43 個 feed，1740 則，去重後 1610 篇
需要補圖 601 篇（已在庫的 0 篇略過）
補圖完成：取得 597 / 601
寫入        新增 1610，更新 0
耗時        52.8s
```

**穩定狀態**（每小時排程的實際樣子）：

```
抓取完成：43 個 feed，1743 則，去重後 1654 篇
需要補圖 130 篇（已在庫的 1385 篇略過）
補圖完成：取得 130 / 130
寫入        新增 269，更新 1385
耗時        22.8s
```

關鍵是**只為新文章補圖**——已在庫的文章圖片不會變，而補圖是整個流程最貴的一步。
穩定狀態下 1654 篇裡只有 130 篇需要打文章頁請求，補圖成本掉到全量的五分之一。

### 4.4 一個真實踩到的坑：行程不會退出

首次匯入時我發現**資料早就寫進去了，但行程永遠不結束**。

而且它一開始偽裝成「抓取很慢」：跑了 45 分鐘沒有任何輸出，我以為是補圖太多。
直到去查資料庫，看到文章已經全部寫入，才知道工作早就做完了——
**真正的耗時是 53 秒，剩下 44 分鐘全是行程卡在那裡不退出**。
（輸出被導向檔案時會緩衝到行程結束才吐出，所以過程中什麼都看不到，
這也是後來補上進度回報的原因。）

原因：`libs/db` 把 MongoDB client 快取在 `globalThis`（Next.js 的標準做法，
避免熱重載時重複建立連線），但一次性腳本跑完後**沒有人關閉這條連線**，
Node 的 event loop 就一直有事可做。

**實際影響比「要按 Ctrl+C」嚴重得多**：放到 GitHub Actions 上，
每次執行都會跑到 20 分鐘上限被判定失敗——即使工作在 23 秒就完成了。
排程會永遠紅燈，而且看 log 還會以為是抓取太慢。

解法是加一個 `closeMongoClient()` 給腳本用，長駐的 server 不呼叫它。

> 💡 **這個故事很有價值**，因為它展現：
> （a）同一段程式在「長駐 server」與「一次性腳本」兩種生命週期下行為不同
> （b）你會追到根因而不是加 `process.exit(0)` 蓋過去
> （c）你能預判它在 CI 上的後果，而不只是本機不方便

---

## 5. 有歷史紀錄嗎

這題要**分三層答，而且要誠實講缺口**——面試官通常更看重你知道自己系統的邊界。

### ✅ 文章本身會累積

ingestion **只 upsert、永不刪除**。

但**原因不是為了做歷史庫**：`ratings`／`comments`／`favorites` 都以
`article_id` 關聯，刪掉新聞會讓使用者的評分和留言查不到對應內容。
所以「保留歷史」其實是資料完整性的副作用。

### ❌ 沒有內容變更的歷史

媒體改了標題，`$set` 會直接覆蓋，舊標題就沒了。沒有做版本控制。

### ❌ 沒有「首次收錄時間」

目前有 `fetchedAt`，但它每次執行都更新，語意是「最後看到」不是「第一次看到」。
真正的時間錨點是 `pubDate`（來源的發佈時間）。

### ⚠️ 資料量會無限成長

每天新增數百篇，一年十萬筆以上。**目前沒有封存或清理策略。**

### 怎麼講這一段

> 「歷史保存目前是資料完整性的副作用，不是刻意設計的功能。
> 如果要正式支援，我會做三件事：加 `firstSeenAt` 區分首次收錄與最後更新；
> 改用 `isArchived` 標記而非刪除來做封存，因為刪除會讓使用者的評分斷鏈；
> 如果要保留標題變更歷史，就得另外開一個 collection 存版本，
> 但那要先確認產品上真的需要，不然只是增加寫入成本。」

**這個回答的價值**：你不只知道缺什麼，還知道每個補法的代價。

---

## 6. 前端技術深入

### 6.1 技術選型

| 類別 | 技術                             | 選它的理由                                           |
| ---- | -------------------------------- | ---------------------------------------------------- |
| 框架 | Next.js 16 App Router + React 19 | Server Component 預設，減少送到瀏覽器的 JS           |
| 語言 | TypeScript `strict`              | 另開 `noUncheckedIndexedAccess`、`noImplicitReturns` |
| 樣式 | Tailwind CSS 3                   | 語意化 CSS 變數 token + `darkMode: 'class'`          |
| 狀態 | Zustand                          | 只放跨元件 UI 狀態，伺服器資料不進 store             |
| 動畫 | motion                           | Modal 與選單的進退場                                 |
| 驗證 | zod                              | 前後端共用同一套 schema                              |
| 測試 | Vitest + Testing Library         | 451 個測試，分 node／jsdom 兩組                      |

**元件用 Atomic Design 分層**：`atoms` → `molecules` → `organisms`，
依賴只能由外往內。atom 裡不會出現 `useSession` 或 server action。

### 6.2 【重點】伺服器端分頁

**原本的寫法**：

```ts
const all = await getNewsActions({ limit: 1000 })   // 一次撈一千筆
const filtered = all.filter(n => n.title.includes(query))
const sorted = filtered.sort(...)
const page = sorted.slice(0, 12)
```

**三個問題**：

1. payload 隨資料量線性成長，行動網路上直接感受得到
2. 每打一個字搜尋，就要對整個陣列重跑一次 filter + sort
3. 評分排序需要對所有評分做平均，等於把 aggregation 搬到使用者手機上

**改法**：搜尋、排序、分頁全部下推到資料庫，前端只留當前這一頁（12 筆）。

依評分排序**不能用一般索引**，因為 `avgRating` 是算出來的欄位，所以走 aggregation：

```ts
;[
    { $match: filter },
    {
        $lookup: {
            from: 'ratings',
            localField: 'article_id',
            foreignField: 'postId',
            as: 'ratingsData',
        },
    },
    { $addFields: { avgRating: { $avg: '$ratingsData.rate' } } },
    { $sort: { avgRating: -1, pubDate: -1 } },
    {
        $facet: {
            // 一次拿到資料與總數
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: limit }],
        },
    },
]
```

> ⚠️ **追問：「為什麼用 `$facet`？」**
> 不用的話要打兩次資料庫：一次拿資料、一次 `countDocuments` 拿總數，
> 而且兩次之間資料可能變動，總數和資料會對不起來。
> `$facet` 讓兩個子管線跑在同一次查詢的同一份快照上。

### 6.3 【重點】競態條件

無限捲動 + 即時搜尋，使用者快速改兩次條件時，**先發出的請求可能後回來**，
舊結果會蓋掉新結果。

```ts
const requestIdRef = useRef(0)

const fetchPage = useCallback(
    async (page, mode) => {
        const requestId = ++requestIdRef.current
        const result = await getNewsActions({ query, sortType, page, limit })
        if (requestId !== requestIdRef.current) return // 已有更新的請求，丟棄
        // ...更新狀態
    },
    [query, sortType]
)
```

> ⚠️ **追問：「用 debounce 不就好了？」**
> debounce 只是**降低發生機率**，不是解決問題——網路慢的時候一樣會發生。
> 兩者解決不同層面：debounce 減少請求量，request id 保證結果順序正確。
> 這題答得出區別，就跟只會背 debounce 的人分出來了。
>
> 也可以提 `AbortController`：它能真的取消請求省下流量，
> 但 Server Actions 目前沒有直接暴露取消機制，所以用 request id 守衛。

### 6.4 【重點】RSC 序列化邊界（最能展現深度）

這是 App Router 特有的坑，準備**兩個**：

#### （a）密碼雜湊外洩到瀏覽器

`getUser` 原本這樣寫：

```ts
return { ...currentUser, id: currentUser._id.toString() } // ⚠️
```

這個回傳值會成為 client component 的 prop，也就是**被序列化進 RSC payload
送到瀏覽器**——`password` 欄位就這樣出現在網頁原始碼裡。

改成逐欄白名單：

```ts
return {
    id: currentUser._id.toString(),
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
    nickname: currentUser.nickname,
    bio: currentUser.bio,
}
```

**關鍵洞察**：在傳統 SSR 裡「後端物件」和「傳給前端的資料」是兩個東西，
中間有一層 API 序列化。RSC 把這層隱形化了，**你在 server component 裡
隨手傳的 prop 就是網路傳輸的內容**。

#### （b）`'use client'` 檔案匯出的常數

從標記 `'use client'` 的模組匯出常數，再於 server component 匯入，
拿到的是 **client reference proxy 而不是實際數值**。

傳給 MongoDB 的 `limit()` 會直接拋 `MongoInvalidArgumentError`。

解法是常數放在**不帶 `'use client'`** 的模組（`constants/common.ts`）。

> 💡 這兩個講完，對方大概就知道你不是只會 `useState`。

### 6.5 樂觀更新與回滾

收藏按鈕先更新畫面再送請求，失敗時還原：

```ts
const handleFavoriteClick = async (id: string) => {
    const previousFavorites = [...favorites]
    setFavorites(prev => prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id])
    try {
        const result = await toggleFavoriteAction(id)
        if (!result.success) throw new Error()
        toastBox(...)
    } catch {
        setFavorites(previousFavorites)   // 回滾
    }
}
```

> ⚠️ **追問：「連續快速點擊會怎樣？」**
> 誠實答：目前每次點擊都會抓當下的 `favorites` 當快照，
> 連點時後面的回滾可能還原到中間狀態。
> 更嚴謹的做法是用 `useReducer` 把樂觀更新做成可疊加的操作佇列，
> 或用 React 19 的 `useOptimistic`。目前的規模還沒到需要那個複雜度。

### 6.6 Hydration mismatch 的處理

深色模式該畫太陽還是月亮，取決於 localStorage 與系統偏好，**伺服器無從得知**。

常見做法是 `mounted` flag，但那會讓圖示延遲到掛載後才出現，畫面閃一下。

**這裡的做法**：兩個圖示都輸出，用 CSS 的 `dark:` 變體決定顯示哪一個。

```tsx
<MdSunny className="hidden dark:block" />
<BsFillMoonStarsFill className="block dark:hidden" />
```

伺服器與客戶端輸出**完全一致**，沒有 mismatch，而且第一幀就是對的
（next-themes 會在 `<head>` 注入同步腳本，首次繪製前就把 class 掛上 `<html>`）。

`resolvedTheme` 只在 `onClick` 裡讀取，不參與 render，所以不影響 hydration。

### 6.7 設計系統與中文排版

不要只說「用 Tailwind」，這裡有真東西：

**顏色走 CSS 變數，而且變數只存 RGB 三個數字**：

```css
--color-card: 255 255 255; /* 不是 #ffffff */
```

```ts
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`
```

這樣 `bg-card/50` 的**透明度修飾語才能運作**——存完整色碼就做不到。

**語意化 token 而非色階**：`surface`／`card`／`muted`／`subtle`／`scrim`，
不用 `gray-500`。深色模式只要換變數值，不用在每個元件加 `dark:` 變體。

**中文排版**（這點特別加分，很少前端會注意）：

```ts
// Tailwind 預設行高是為拉丁文調的（text-sm 是 14/20），
// 中文字面大、沒有 x-height 的視覺留白，同樣行高會顯得擁擠
fontSize: {
    sm: ['0.875rem', { lineHeight: '1.5rem' }],   // 預設 1.25rem
    base: ['1rem', { lineHeight: '1.75rem' }],
}

// Inter 只含拉丁字符，不明確指定中文字體的話，
// Windows 會掉到新細明體，跟 Inter 併排時粗細與字面大小都對不起來
fontFamily: {
    sans: ['var(--font-inter)', 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', ...]
}
```

**`cn()` 用 `twMerge` 而非字串相接**：

```ts
cn(
    'px-4 py-2',
    'px-6'
) // → 'py-2 px-6'
`px-4 py-2 ${className}` // → 'px-4 py-2 px-6' 兩個都在，由 CSS 順序決定勝負
```

### 6.8 狀態管理的邊界

**Zustand 只放「跨元件、與伺服器無關的 UI 狀態」**——目前只有兩項：
搜尋關鍵字與排序方式。因為 `SearchBar`、`SortDropdown`、`useNewsFeed`
三者互不相鄰卻要共用。

**伺服器資料不進 store**，生命週期由 server component 的初始資料
加上 hook 內的 `useState` 管理。

訂閱一律搭配 `useShallow`，否則每次 `set` 都會讓所有訂閱者重繪：

```ts
const { query, sortType } = useNewsStore(
    useShallow((state) => ({ query: state.query, sortType: state.sortType }))
)
```

> ⚠️ **追問：「為什麼不用 Redux / React Query？」**
> Redux 對兩個欄位是殺雞用牛刀。
> React Query 在傳統 SPA 很合理，但這裡資料是由 Server Component 帶下來的，
> 快取層已經由 Next.js 處理，再疊一層 client 快取會有兩份真相來源。

---

## 7. 後端／資料層深入

### 7.1 沒有獨立後端，是刻意的

| 類別     | 技術                                         |
| -------- | -------------------------------------------- |
| 資料存取 | Server Actions（主要）+ 4 個 route handler   |
| 資料庫   | MongoDB Atlas，官方 driver，**沒有 ORM/ODM** |
| 身分驗證 | NextAuth v4，JWT strategy + MongoDBAdapter   |
| 登入方式 | Google／Facebook／GitHub／帳號密碼           |
| 密碼     | bcryptjs，成本因子 12                        |

**為什麼不做 REST 層**：Server Actions 讓 client 直接呼叫伺服器函式，
省掉 DTO、fetch 樣板、以及型別在邊界上重複定義的問題。

**為什麼不用 ORM**：這個專案的查詢複雜度集中在 aggregation pipeline，
ORM 對那塊幫助有限，反而多一層抽象要學。直接用 driver + 自己定義的
`XxxDocument` 介面就夠了。

### 7.2 【必考】Server Action 的安全模型

> ⚠️ **「Server Action 可以被 client 直接呼叫，那安全性怎麼辦？」**

這題一定會被問，而且專案裡**真的修過這個漏洞**：

**Server Action 本質上是公開端點。** Next.js 會為每個 action 產生一個 id，
任何人都能用那個 id 帶任意參數呼叫——它不是「只有你的按鈕能呼叫的函式」。

**原本的寫法**：

```ts
export async function getNewsActions({ userId, ... }) { ... }   // ⚠️
```

`userId` 是參數，等於**任何人都能帶別人的 id 讀取他人的收藏與個人評分**。

**三條規則**：

**（1）身分一律由伺服器解析，永不信任參數**

```ts
const session = await getSession()
const userId = session?.user?.id ?? null
```

**（2）寫入與刪除的查詢條件要綁 `userId`**

不要「先查出來、比對擁有者、再刪」——那有 TOCTOU 的空間，也多一次查詢：

```ts
await commentsCollection.deleteOne({
    _id: new ObjectId(commentId),
    userId: currentUser.id, // 條件直接綁定
})
```

**（3）回傳結果物件，不要往外丟例外**

```ts
return { success: false as const, error: 'Internal server error' }
```

`as const` 不能省，否則 `success` 會被推論成 `boolean`，呼叫端無法靠它收窄型別。

而且**錯誤訊息要一致**：註冊時 Email 已存在回的是
`'Invalid email or password'`，跟驗證失敗同一句——避免被拿來列舉哪些
Email 已註冊。

### 7.3 索引設計

每個索引都對應到程式中實際存在的查詢：

| Collection | 索引                       | 對應的查詢                               |
| ---------- | -------------------------- | ---------------------------------------- |
| news       | `article_id` (unique)      | `$in` 查詢；**保證 upsert 的正確性**     |
| news       | `pubDate: -1`              | 依日期排序，每次首頁載入                 |
| news       | `views: -1`                | 「最熱門」排序                           |
| ratings    | `postId`                   | 平均評分聚合的 `$match`                  |
| ratings    | `userId + postId` (unique) | 個人評分；**從資料層擋掉重複評分**       |
| comments   | `postId + createdAt: -1`   | 文章評論列表，複合索引一次滿足篩選與排序 |
| users      | `email` (unique)           | 登入驗證；擋重複註冊                     |

> 💡 **兩個唯一索引是「用資料庫做約束」而不是只靠應用層檢查**——
> 併發時應用層的「先查再寫」會有競態，唯一索引不會。

`pubDate` 存成 `'YYYY-MM-DD HH:mm:ss'` 字串而非 Date，是為了配合既有 schema。
關鍵是**零填補格式讓字典序等於時間序**，所以 `{ pubDate: -1 }` 排序正確，
範圍查詢（今天／近 7 天）也能直接用 `$gte`。

---

## 8. 測試策略

**451 個測試，覆蓋率 98.45% statements / 93.59% branches。**

但**不要只報數字**，講方法論：

### 8.1 分兩個環境跑

| Project | 環境  | 範圍                                    |
| ------- | ----- | --------------------------------------- |
| server  | node  | Server Actions、API route、資料庫與驗證 |
| client  | jsdom | 元件、hooks、store                      |

混在同一個環境會出問題：jsdom 下 mongodb 行為不一致，node 環境又沒有 document。

### 8.2 測行為不測實作

用 role／label 查詢，不用 class 名稱或內部 state：

```ts
screen.getByRole('button', { name: '加入收藏' }) // ✅
container.querySelector('.favorite-btn') // ❌
```

改樣式或重構不該讓測試變紅。**這也倒逼無障礙**——沒有 `aria-label`
的 icon-only 按鈕根本查不到，測試寫不出來。

### 8.3 資料庫不真的連線

用替身記錄「送出去的查詢」，回傳值由測試指定：

```ts
expect(news.find).toHaveBeenCalledWith({
    $or: [
        { title: { $regex: '颱風', $options: 'i' } },
        { description: { $regex: '颱風', $options: 'i' } },
    ],
})
```

驗證的是**我們組出來的 filter 與 pipeline**，MongoDB 本身的行為不是我們的責任。

### 8.4 安全性行為用測試釘住

```ts
it('絕不回傳密碼雜湊', async () => {
    expect(user).not.toHaveProperty('password')
    expect(JSON.stringify(user)).not.toContain('$2a$12$hashed')
})

it('userId 取自 session，不接受呼叫端傳入', async () => { ... })
```

### 8.5 【殺手鐧】驗證測試本身有效

> ⚠️ **「你怎麼知道測試有沒有用？」**

我實際把三處行為**改壞**，確認測試會紅：

| 改壞的地方                       | 失敗的測試                               |
| -------------------------------- | ---------------------------------------- |
| `getUser` 改成展開整份 document  | 「絕不回傳密碼雜湊」「只輸出白名單欄位」 |
| 拿掉 `useNewsFeed` 的競態守衛    | 「較舊的回應不會覆蓋較新的回應」         |
| signup 改成回「此 Email 已註冊」 | 「錯誤訊息不透露該帳號已存在」           |

**4 個測試失敗、其餘 216 個通過**，正好是對應的那幾個。之後還原。

> 💡 這個回答很少人給得出來。覆蓋率高不代表測試有效——
> 覆蓋率只說「這行被執行過」，不說「這行壞掉時會被抓到」。

---

## 9. 已知限制與下一步

**誠實列出限制，比假裝完美更有說服力。**

| 限制                     | 影響                       | 打算怎麼做                                |
| ------------------------ | -------------------------- | ----------------------------------------- |
| 分類值有 27 種且互相打架 | 分類篩選做不出來           | 正規化成 10 類                            |
| 同一篇的分類是非決定性的 | 同上                       | 去重時「具體分類優先」                    |
| 自由時報沒有 guid        | 文章編號變更會斷鏈         | 已改用編號萃取，殘餘風險接受              |
| 沒有 `firstSeenAt`       | 無法區分首次收錄與最後更新 | 加欄位                                    |
| 資料量無限成長           | 一年十萬筆以上             | `isArchived` 標記，不能刪除               |
| 沒有內容變更歷史         | 改標題後舊標題消失         | 視產品需求再決定                          |
| `unoptimized: true`      | 圖片沒走 Vercel 最佳化     | 權衡取捨：外部 CDN 已壓縮過，最佳化要付費 |

### 分類問題可以講得很細（展現資料思維）

7 家媒體的 `category` 實際值有 **27 種**，兩類毛病：

- **同義重複**：運動 vs 體育、娛樂 vs 影劇、兩岸 vs 大陸、產經 vs 財經、科技 vs 3C
- **根本不是分類**：即時、全部、要聞、新聞、深度報導——這些是 feed 類型不是主題

而且 ETtoday 和自由時報的文章**會同時出現在「即時」和「政治」兩個 feed**，
去重時只留先看到的那筆，而 feed 是併發抓取的——**同一篇文章這次歸「即時」，
下次重跑可能變「政治」**。

> 💡 **這段是很好的收尾**，因為它展現你會**從資料模型往回推 UI**，
> 而不是接到「加個分類下拉」就開始刻元件。

---

## 10. 面試問答演練

### Q：這個專案最難的部分是什麼？

> 「不是任何單一功能，是**意識到 Server Actions 是公開端點**這件事。
> 原本我把它當成『只有我的按鈕會呼叫的函式』，所以 `userId` 就當參數傳。
> 後來才理解它會被編譯成一個帶 id 的端點，任何人都能帶任意參數呼叫。
> 那之後我把所有 action 的身分解析都收回伺服器端，並且用測試釘住。」

### Q：如果流量變大，瓶頸在哪？

> 「最先撐不住的是首頁列表的搜尋。目前用 `$regex` 做標題和摘要的模糊比對，
> 那是 collection scan，資料量上去會線性變慢。
> 換成 MongoDB 的 text index 或 Atlas Search 是第一步。
>
> 第二個是評分排序的 aggregation——每次都要 `$lookup` 整個 ratings collection
> 算平均。可以把 `avgRating` 預先算好存回 news，評分時增量更新，
> 用一般索引排序就好。這是拿寫入複雜度換讀取效能。」

### Q：為什麼選 Next.js 而不是純 React？

> 「主要是 Server Component。新聞列表的第一頁由伺服器渲染好送出，
> 使用者不用等 JS 下載執行完才看到內容——對內容型網站這是體感差異最大的地方。
>
> 另一個是 Server Actions 省掉整個 API 層。
> 但代價是要理解 server／client 的序列化邊界，那不是免費的——
> 我就在那邊踩過密碼外洩和 client reference proxy 兩個坑。」

### Q：你會怎麼改進這個專案？

> 「短期是分類正規化，因為那卡住了篩選功能，而且問題在資料層不在 UI。
>
> 中期我想處理歷史紀錄——現在文章累積是資料完整性的副作用，
> 不是設計出來的功能，缺 `firstSeenAt` 也缺封存策略。
>
> 長期的話，這個專案有評分和評論資料，可以做個人化推薦，
> 但那要先有足夠的使用者行為資料才有意義。」

### Q：團隊協作的話，你會怎麼讓別人接手？

> 「我寫了一份 `CLAUDE.md` 放在 repo 根目錄，涵蓋技術棧、指令、
> 命名規範、架構分層，以及最重要的『不能違反的規則』——
> 例如 `article_id` 的產生規則一旦上線就不能改，改了所有使用者資料會失聯。
>
> 那份文件的第一句話是『規則以這個 repo 現在實際怎麼做為準，
> 若程式碼與本文不一致，請一併修正其中一邊』——
> 我不想要一份會過期的文件。」

---

## 附：最容易被追問的三題（優先練這些）

1. **Server Action 的安全模型**（§7.2）— 深度，而且你真的修過那個漏洞
2. **RSC 序列化邊界**（§6.4）— 區隔度最高，多數候選人講不到
3. **歷史紀錄的缺口**（§5）— 展現你知道自己系統的邊界在哪

講深三題，勝過十題都講一半。
