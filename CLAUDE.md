# Score News 開發規範

這份文件同時是團隊規範與 Claude Code 的專案脈絡。
規則以「這個 repo 現在實際怎麼做」為準；若程式碼與本文不一致，請一併修正其中一邊，不要讓它漂移。

---

## 1. 專案簡介與技術棧

**Score News** 是新聞瀏覽網站，核心是「讓讀者對新聞評分、收藏並留言」。
首頁提供搜尋、排序（時間／評分／熱門）與無限捲動；後台可管理收藏、評論與個人資料。

| 層面       | 技術                                        | 備註                                                 |
| ---------- | ------------------------------------------- | ---------------------------------------------------- |
| 框架       | Next.js 16（App Router）+ React 19          | 預設 Server Component，`dev` 走 Turbopack            |
| 語言       | TypeScript（`strict`）                      | 另開 `noUncheckedIndexedAccess`、`noImplicitReturns` |
| 樣式       | Tailwind CSS 3                              | 語意化 CSS 變數 + `darkMode: 'class'`                |
| 資料庫     | MongoDB（官方 driver，無 ORM）              | 直接操作 collection，型別靠 `libs/db.ts` 的介面      |
| 身分驗證   | NextAuth v4（JWT strategy）+ MongoDBAdapter | Google / Facebook / GitHub / 帳密                    |
| 資料存取   | Server Actions                              | 沒有自建 REST 層，僅 4 個 route handler              |
| 用戶端狀態 | Zustand                                     | 只放跨元件的 UI 狀態                                 |
| 其他       | zod、motion、react-hot-toast、next-themes   |                                                      |
| 測試       | Vitest 4 + Testing Library                  | 分 `server`（node）／`client`（jsdom）兩組           |
| 部署       | `output: 'standalone'` + Docker             |                                                      |

**沒有使用的東西**（別憑印象加回來）：沒有 ORM、沒有 React Query／SWR、
沒有 CSS Module 或 styled-components、沒有 Redux。
`axios` 雖列在 dependencies 與 README，但整個原始碼已經沒有任何一處 import
它——要發 HTTP 請求請用 `fetch`，不要因為它在 package.json 就拿來用。

---

## 2. 常見開發指令

```bash
npm run dev              # 開發伺服器（Turbopack）
npm run build            # 正式建置（會做完整型別檢查）
npm start                # 跑建置後的產物

npm run lint             # ESLint
npm run format           # Prettier 寫入整個專案
npx tsc --noEmit         # 只做型別檢查，比 build 快很多

npm test                 # 跑一次全部測試
npm run test:watch       # 監看模式
npm run test:coverage    # 覆蓋率報告（HTML 在 coverage/index.html）
npm test -- --project server   # 只跑 server 那組
```

資料庫維運腳本（需要 `.env.local` 的 `MONGODB_URI`）：

```bash
npx tsx scripts/createIndexes.ts   # 建立查詢所需索引，冪等，可重複執行
npx tsx scripts/ingestNews.ts      # 從 RSS 抓取新聞（upsert，可重複執行）
npx tsx scripts/checkFeeds.ts      # RSS 來源健康檢查，只讀不寫
```

⚠️ 破壞性，需明確確認：

```bash
npx tsx scripts/resetNews.ts --yes-i-really-mean-it   # 清空新聞與所有評分／評論／收藏
```

`scripts/seedNews.ts` 與 `scripts/seedFromApi.ts` 是切換到 RSS 之前的舊工具，
`seedFromApi` 會先 deleteMany 再 insert，不可在正式資料上執行。

**送出前的自我檢查**：`npx tsc --noEmit && npm run lint && npm test`。
CI（`.github/workflows/ci.yml`）跑的是 lint → test → build，三者皆須通過。

---

## 3. 程式碼風格與命名規範

### 格式

由 Prettier 與 EditorConfig 決定，不要手動爭論：

- 縮排 4 空格、不用 tab
- **不加分號**、字串用單引號
- 每行上限 100 字元、trailing comma 為 `es5`
- 換行 LF、UTF-8、檔尾留一個換行
- Tailwind class 由 `prettier-plugin-tailwindcss` 自動排序，`cn()` 內的字串也在排序範圍

### 命名

| 對象                 | 規則                           | 範例                                     |
| -------------------- | ------------------------------ | ---------------------------------------- |
| 元件檔與元件         | PascalCase，**default export** | `NewsCard.tsx` → `NewsCard`              |
| Hook                 | `use` 開頭，具名 export        | `useNewsFeed.ts` → `useNewsFeed`         |
| Server Action        | 動詞開頭、`Action` 結尾        | `toggleFavoriteAction`、`getNewsActions` |
| 前端型別             | `XxxType`                      | `NewsDataType`、`CommentType`            |
| 資料庫 document 型別 | `XxxDocument`                  | `NewsDocument`、`UserDocument`           |
| 模組級常數           | SCREAMING_SNAKE_CASE           | `NEWS_PAGE_SIZE`、`CARD_CLASSES`         |
| 事件處理函式         | `handle` 開頭                  | `handleSubmit`、`handleFavoriteClick`    |
| 事件 prop            | `on` 開頭                      | `onClose`、`onRatingUpdate`              |

其他慣例：

- **元件用 default export，工具／型別／常數用具名 export。**
- 元件的 props 一律宣告 `interface XxxProps`，不要行內寫死。
- 型別匯入用 `import type { ... }`，與值匯入分開。
- **少用型別斷言**。`as` 幾乎都代表型別沒設計好；真的必要時（例如 MongoDB
  `$facet` 的回傳）要在旁邊寫清楚為什麼。
- `noUncheckedIndexedAccess` 是開的：`arr[0]` 的型別帶 `undefined`，
  請用 `arr[0]?.x` 或 `?? 預設值`，不要用 `!` 硬壓。
- **三元運算子最多一層，不得巢狀。** 巢狀三元沒有縮排可循，
  要靠肉眼配對 `?` 和 `:` 才知道哪個條件對應哪個結果，改的時候很容易接錯分支。

    超過一層時，依情境改寫成下列其中一種：

    ```ts
    // ✗ 巢狀三元
    const label = isLoading ? '傳送中...' : initialRating > 0 ? '修改評論' : '送出評論'

    // ✓ 查表：分支是「狀態 → 值」的對應時最清楚
    const LABEL = { idle: '送出評論', edit: '修改評論', loading: '傳送中...' }
    const label = LABEL[status]

    // ✓ 提前 return：分支會回傳 JSX 或需要不同前置處理時
    if (isLoading) return '傳送中...'
    return initialRating > 0 ? '修改評論' : '送出評論'

    // ✓ 抽成具名變數：條件本身需要解釋時，順便為它命名
    const isEditing = initialRating > 0
    const label = isEditing ? '修改評論' : '送出評論'
    ```

    單層三元用在短的值選擇上仍然完全可以，例如
    `favorite ? '取消收藏' : '加入收藏'`——不需要為了避免三元而改寫成 `if`。

### 註解

用**繁體中文**，而且只寫「為什麼」，不要複述程式碼在做什麼。
值得留下的註解長這樣（皆取自本 repo）：

```ts
// userId 一律由 server 端的 session 取得，不接受呼叫端傳入。
// 這是 client 可直接呼叫的 server action，若信任參數，
// 任何人都能帶別人的 id 讀取他人的收藏與個人評分。
```

尤其這幾類一定要留註解：繞過預設行為的 workaround、效能取捨、安全性考量、
以及「看起來多餘但刪掉就會壞」的程式碼。

---

## 4. 架構與資料夾結構

```
app/                    Next.js App Router
  (root)/               首頁群組（自有 layout：較高的 header + 搜尋列）
  (other)/              後台等內頁群組（一般 header）
  api/                  4 個 route handler：nextauth / signup / comment / profile
  layout.tsx            根 layout，掛 Providers
actions/                Server Actions —— 應用程式的資料存取層
components/             原子設計（Atomic Design）
  atoms/                最小單位，無業務邏輯：Button、Input、Avatar
  molecules/            數個 atom 組成的小單元：SearchBar、CommentForm、Modal
  organisms/            帶業務語意的區塊：NewsCard、CommentSection、ProfileForm
hooks/                  可重用的 client 邏輯
libs/                   基礎設施：db、mongodb、auth、cn、styles
store/                  Zustand store
providers/              Context provider（Session／Theme／Toast）
constants/              跨模組共用常數
types/                  共用型別宣告
test/                   測試 setup 與共用 helper
scripts/                一次性維運腳本（seed、索引）
```

### 分層原則

**資料流向是單向的：**

```
Server Component（page/layout）
      └─ 呼叫 actions/ 取得初始資料
            └─ 以 props 交給 Client Component
                  └─ 後續互動再呼叫 actions/
```

- `app/` 只負責組裝與取初始資料，商業邏輯不要寫在 page 裡。
- `actions/` 是唯一碰資料庫的地方（`scripts/` 例外）。元件不得直接 import `libs/db`。
- `libs/` 不可反向 import `actions/`、`components/`、`hooks/`。
- `components/` 的依賴只能由外層指向內層：organisms → molecules → atoms，
  **不可反向**。atom 裡不該出現 `useSession` 或 server action。

### 放在哪裡？

| 情況                          | 位置                                         |
| ----------------------------- | -------------------------------------------- |
| 只有一個元件用到的樣式        | 直接寫在該元件                               |
| 兩個以上檔案共用的 class 組合 | `libs/styles.ts`                             |
| 只有一頁用到的元件            | 跟該頁放一起（如 `app/(root)/NewsList.tsx`） |
| 跨頁共用的元件                | `components/` 對應層級                       |
| 跨元件共用的 UI 狀態          | `store/newsStore.ts`                         |
| 只有單一元件樹用到的狀態      | 該元件的 `useState`                          |

---

## 5. 專案注意事項

### 5.1 狀態管理

**Zustand 只放「跨元件、與伺服器無關的 UI 狀態」。**
目前只有兩項：搜尋關鍵字 `query` 與排序方式 `sortType`，
因為 `SearchBar`、`SortDropdown` 與 `useNewsFeed` 三者互不相鄰卻要共用。

伺服器資料**不要放進 store**。它的生命週期由 server component 的初始資料
加上 hook 內的 `useState` 管理（見 `useNewsFeed`）。

訂閱 store 一律搭配 `useShallow`，否則每次 `set` 都會讓所有訂閱者重繪：

```ts
const { query, sortType } = useNewsStore(
    useShallow((state) => ({ query: state.query, sortType: state.sortType }))
)
```

測試裡 store 是 module 單例，每個測試要自行還原（見 `store/newsStore.test.ts`）。

### 5.2 資料存取（Server Actions）

沒有 REST 封裝層，前端直接呼叫 server action。因此有幾條硬規則：

**（1）回傳結果物件，不要往外丟例外。**
所有 action 用 `try/catch` 包住，回傳可辨識的形狀，讓呼叫端不必 try/catch 就能處理：

```ts
export async function xxxAction(...) {
    try {
        // ...
        return { success: true as const, data }
    } catch (error) {
        console.error('Error in xxxAction:', error)
        return { success: false as const, error: 'Internal server error' }
    }
}
```

`as const` 不能省，否則 `success` 會被推論成 `boolean`，呼叫端無法靠它收窄型別。

**（2）身分一律由伺服器解析，永遠不信任參數。**
Server action 是 client 可直接呼叫的端點。要取得目前使用者：

```ts
const auth = await requireAuth()
if (!auth.authenticated) return { success: false as const, error: auth.error }
const { id: userId } = auth.user
```

**絕不可以**把 `userId` 開成參數讓呼叫端傳入——那等於任何人都能讀寫他人資料。
只需要 session 不需要完整使用者時用 `getSession()`。

**（3）寫入與刪除的查詢條件要綁 `userId`。**
不要「先查出來、比對擁有者、再刪」，直接把擁有者條件寫進 filter：

```ts
await commentsCollection.deleteOne({ _id: new ObjectId(commentId), userId: currentUser.id })
```

**（4）不要把 document 原封不動回傳。**
逐欄挑選需要的欄位再回傳。展開整份 document 會把 `password`、`_id` 一併
序列化進 RSC payload 送到瀏覽器（`getUser` 與 `toNewsData` 都是這樣寫的原因）。

**（5）`ObjectId` 不得跨越 server／client 邊界。**回傳前 `.toString()`。

**（6）新增查詢時同步更新 `scripts/createIndexes.ts`。**

### 5.3 元件撰寫

- **預設是 Server Component。** 只有需要 state、effect、事件處理或瀏覽器 API 時
  才加 `'use client'`，而且盡量往樹的葉子推。
- ⚠️ **常數不要從 `'use client'` 檔案匯出給 server component 用。**
  拿到的會是 client reference proxy 而不是實際數值——`NEWS_PAGE_SIZE` 曾因此
  讓 MongoDB 的 `limit()` 直接拋 `MongoInvalidArgumentError`。共用常數放
  `constants/`（不帶 `'use client'` 的模組）。
- 對外開放 `className` 的元件，一律用 `cn()` 合併，不要用字串相接。
- **無障礙不是可選項**：icon-only 按鈕要有 `aria-label`，錯誤訊息用 `role="alert"`
  並以 `aria-describedby` 關聯，純裝飾圖片 `alt=""`。
  測試大量依賴 role／label 查詢，缺了會直接讓測試寫不出來。
- `next/image` 的 `sizes` 要對得上實際渲染尺寸，否則會下載最大斷點的圖。
  只有首屏一定看得到的圖才給 `priority`。
- 非同步操作進行中要停用送出按鈕，避免重複送出。
- 樂觀更新（如收藏）失敗時務必還原先前狀態。

### 5.4 樣式統一規範

**只用語意化 token，不要用 Tailwind 的原生色階。**
`text-gray-500`、`bg-white`、`dark:bg-gray-800` 一律禁止——它們在深色模式會壞掉。
顏色定義在 `styles/globals.css` 的 CSS 變數，由 `tailwind.config.ts` 對應成 token：

| 用途                     | Token                            |
| ------------------------ | -------------------------------- |
| 頁面底色／主要文字       | `background` / `foreground`      |
| 浮層（Modal、下拉選單）  | `surface`                        |
| 卡片、留言區塊           | `card`                           |
| 弱化文字／底色           | `muted` / `muted-foreground`     |
| 再弱一階（時間、字數）   | `subtle`                         |
| 邊框／輸入框／focus ring | `border` / `input` / `ring`      |
| 主色、危險、成功         | `primary` / `danger` / `success` |
| 星等                     | `star` / `star-foreground`       |
| Modal 遮罩               | `scrim`（日夜都是暗的，不反轉）  |
| 品牌漸層                 | `brand-from` / `brand-to`        |

其他規則：

- 不指定顏色的 `border` 會自動吃語意化邊框色，不需要補 `dark:border-*`。
- 深淺色以 `class` 切換。**不要在 render 期間用 JS 判斷主題**——會 hydration
  mismatch。兩種狀態都輸出，交給 `dark:` 變體決定（見 `ThemeSwitcher`）。
- 共用 class 組合放 `libs/styles.ts`，且只放「出現在兩個以上檔案」的；
  單一元件自己的樣式寫在元件裡。
- 字級用 Tailwind 的 `text-*`——行高已為中文放寬過，不要另外覆寫 `leading`。

### 5.5 新聞資料源（RSS）

新聞來自 7 家台灣媒體公開的 RSS，共 43 個 feed，程式在 `libs/rss/`：

| 檔案                | 職責                                           |
| ------------------- | ---------------------------------------------- |
| `sources.ts`        | 來源清單與各家的圖片取得策略                   |
| `parser.ts`         | RSS 2.0／Atom → 統一的 `FeedItem`              |
| `toNewsDocument.ts` | `FeedItem` → `NewsDocument`，產生 `article_id` |
| `ogImage.ts`        | feed 沒給圖時抓文章頁的 OpenGraph              |
| `ingest.ts`         | 抓取 → 去重 → 補圖 → upsert                    |

**只存標題與摘要並連回原站，不抓全文。** 這是版權上站得住腳的做法，
前端在 `content` 為空時本來就會顯示 `description` 並附「閱讀完整原文」連結。

三條不能違反的規則：

1. **`article_id` 的產生規則不可變更。** 它是 `ratings`／`comments`／`favorites`
   唯一的關聯鍵，改了等於所有使用者的評分與留言變成孤兒資料。
   規則是 `sha1(outlet + guid)`，沒有 guid 的來源退回 `sha1(outlet + link)`。
2. **ingestion 只 upsert，永不刪除。** 刪掉新聞會讓關聯資料查不到對應內容。
3. **`views` 與 `image_url` 不可被例行更新覆蓋。** `views` 只放 `$setOnInsert`；
   `image_url` 只有這次真的拿到圖才 `$set`，否則補圖失敗會把好圖換成預設圖。
   兩者不能同時出現在 `$set` 與 `$setOnInsert`，MongoDB 會拒絕衝突路徑。

新增來源時：`sources.ts` 加一筆，跑 `checkFeeds.ts` 確認可解析，
若圖片來源不同要一併確認 `parser.ts` 認得該欄位、`next.config.ts` 的
`remotePatterns` 涵蓋該網域。測試一律用 `test/fixtures/rss/` 的真實 feed，不打網路。

抓取由 GitHub Actions 每小時排程（`.github/workflows/ingest-news.yml`），
來源健康檢查每週一次。

### 5.6 測試

細節見 README 的「測試」章節，此處只列硬規則：

- **測行為，不測實作。** 用 role／label 查詢，不要用 class 名稱或內部 state。
- 資料庫不真的連線，用 `test/helpers/db.ts` 的 collection 替身。
- 新增安全性相關行為時必須補測試釘住（權限、資料外洩、身分來源）。
- 覆蓋率門檻 90%（branches 85%），未達標 CI 會失敗。

---

## 6. Git 規範

### 分支

- `main` 是預設分支，保持隨時可部署。
- 開發一律開分支：`<type>/<簡短描述>`，例如 `feat/comment-filter`、`fix/session-id`。
- 分支保持小而聚焦，一個分支處理一件事。

### Commit 訊息

採 **Conventional Commits**，標題用繁體中文描述「做了什麼」：

```
<type>(<scope>): <標題，繁體中文，不超過 50 字元，句尾不加句號>

<空行>
<內文：說明「為什麼」這樣改，而不是「改了什麼」——改了什麼看 diff 就知道。
 有取捨、有踩過的坑就寫進來。每行不超過 72 字元。>
```

本專案使用的 type：

| type       | 用途                     |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | 修 bug                   |
| `perf`     | 效能改善                 |
| `refactor` | 重構，行為不變           |
| `docs`     | 文件（README、本規範等） |
| `test`     | 測試相關                 |
| `chore`    | 建置設定、依賴更新等雜項 |

實際範例（本 repo 的歷史）：

```
fix(auth): 補上缺失的 session callback，並停止外洩密碼雜湊
perf: 新聞列表改為伺服器端分頁，並修正 userId 可被偽造的問題
refactor(ts): 移除無謂的型別斷言，收緊 tsconfig 與 eslint 設定
```

### 提交前

CI 會跑 lint → test → build，本地請先自行確認：

```bash
npx tsc --noEmit && npm run lint && npm test
```

不要用 `--no-verify` 略過檢查。hook 擋下來就去修根因。

### 其他

- 不要提交 `.env*`、`coverage/`、`.next/`（`.gitignore` 已涵蓋）。
- 依賴有變動時 `package-lock.json` 要一起提交。
- 修 bug 時盡量附上會失敗的測試，證明它真的修好了。

> **目前的缺口**：`package.json` 有 `lint-staged` 設定，但 `.husky/` 底下
> 沒有任何被追蹤的 hook 檔案（只有 gitignore 掉的 `_/` 執行期目錄），
> 所以 pre-commit 實際上不會執行任何檢查。
> 另外 `prepare` script 用的 `husky install` 在 husky v9 已淘汰，應改為 `husky`。
> 修好之前，格式與 lint 只能靠本地自行執行與 CI 把關。
