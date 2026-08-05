# Score News 📰

**Score News** 是一個提供新聞瀏覽體驗的網站，特色包括 **評分、收藏**，讓讀者能夠更有互動性地參與新聞內容。  
我們的目標是提升使用者的新聞閱讀體驗，使其更具個人化與社群互動性。
(建議使用Chrome or Safari 登入)

**開發中**:

- 收藏功能 完成
- 註冊功能 完成
- 登入功能(第三方登入) 完成
- 搜尋功能 完成
- 評分功能 完成
- RWD
- 元件優化整理

## 特色功能 (Features)

- ⭐ **新聞評分**：讓讀者對新聞進行評分，衡量新聞的影響力。
- 📌 **收藏新聞**：標記有趣的新聞，稍後閱讀或歸檔保存。
- 🎨 **極簡 UI 設計**：直覺、清爽的界面，提升閱讀體驗。
- ⚡ **即時更新**：獲取最新新聞，保持資訊流動性。
- 🔑 **安全登入**：使用 NextAuth.js 進行 OAuth 或密碼登入驗證。

## 技術棧 (Tech Stack)

本專案使用以下技術：

- **[Next.js](https://nextjs.org/)** - React 框架，提供伺服器端渲染 (SSR) 與靜態生成 (SSG)。
- **[TypeScript](https://www.typescriptlang.org/)** - 增強 JavaScript 的型別安全性。
- **[Tailwind CSS](https://tailwindcss.com/)** - 高效、易用的 CSS 框架，實現現代化 UI 設計。
- **[Zustand](https://zustand-demo.pmnd.rs/)** - 輕量級的狀態管理庫，簡化應用狀態管理。
- **[Axios](https://axios-http.com/)** - 用於處理 HTTP 請求，獲取新聞與使用者資料。
- **[NextAuth.js](https://next-auth.js.org/)** - 提供簡單、安全的身份驗證系統，支援 OAuth 和密碼登入。
- **[Vercel](https://vercel.com/)** - 最佳化的 Next.js 部署平台，確保穩定與快速的網站運行。
- **[MongoDB](https://www.mongodb.com/)** - NoSQL 資料庫，存儲用戶、新聞、評論等數據。
- **[Vitest](https://vitest.dev/)** + **[Testing Library](https://testing-library.com/)** - 單元與元件測試。

## 測試 (Testing)

```bash
npm test              # 跑一次全部測試
npm run test:watch    # 監看模式，改檔案就重跑相關測試
npm run test:coverage # 產生覆蓋率報告（HTML 在 coverage/index.html）
```

測試分成兩個 project，各自跑在合適的環境：

| Project  | 環境  | 範圍                                    |
| -------- | ----- | --------------------------------------- |
| `server` | node  | server actions、API route、資料庫與驗證 |
| `client` | jsdom | 元件、hooks、zustand store              |

只跑其中一組：`npm test -- --project server`。

### 撰寫原則

- **測行為，不測實作**：查詢用 role / label 之類使用者看得到的線索，
  而不是 class 名稱或內部 state。改寫樣式或重構不該讓測試變紅。
- **資料庫不真的連線**：`test/helpers/db.ts` 提供 collection 的替身，
  記錄送出去的 filter / pipeline，並讓測試指定回傳值。驗證的是我們組出來的查詢，
  MongoDB 本身的行為不是我們的責任。要在測試檔頂層自行掛上：

    ```ts
    vi.mock('@/libs/db', async () => ({
        getCollection: (await import('@/test/helpers/db')).getCollection,
    }))
    ```

- **共用假資料放 `test/helpers/fixtures.ts`**，用 `makeXxx({ 只寫這次在意的欄位 })`
  覆寫，讓每個測試的重點一眼可見。
- **安全性行為要有測試釘住**：例如 `getUser` 不得回傳密碼雜湊、
  `getNewsActions` 的 userId 只能來自 session、刪留言必須綁 userId。
  這些過去都真的出過問題。
- 覆蓋率門檻設在 90%（branches 85%），低於門檻 CI 會失敗。

## 聯絡我們 (Contact Us)

- Github Repository：[Score News](https://github.com/jasper0730/next-news-tw)
- 提交問題 (Issues)：[GitHub Issues](https://github.com/jasper0730/next-news-tw/issues)
