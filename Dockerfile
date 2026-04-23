# ============================
# 階段一：基礎映像 (base)
# 使用輕量的 Node.js 20 Alpine 版本作為所有階段的基礎
# ============================
FROM node:20-alpine AS base

# ============================
# 階段二：安裝依賴 (deps)
# 只安裝 npm 套件，不複製原始碼，利用 Docker layer cache 加速重複 build
# ============================
FROM base AS deps

# 安裝 libc6-compat：Alpine 缺少部分 glibc 相容函式庫，某些 npm 套件需要它
RUN apk add --no-cache libc6-compat

# 設定工作目錄
WORKDIR /app

# 只複製 package.json 和 package-lock.json
# 這樣只有在依賴改變時才會重新執行 npm ci，節省 build 時間
COPY package.json package-lock.json* ./

# 根據 package-lock.json 精確安裝所有依賴（ci 模式不會修改 lock 檔）
RUN npm ci

# ============================
# 階段三：編譯原始碼 (builder)
# 將程式碼 build 成 Next.js standalone 輸出
# ============================
FROM base AS builder
WORKDIR /app

# 從 deps 階段複製已安裝好的 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 複製全部原始碼（.dockerignore 會排除不必要的檔案）
COPY . .

# 執行 Next.js build，產生 .next/standalone 輸出
RUN npm run build

# ============================
# 階段四：正式執行環境 (runner)
# 只保留執行所需的檔案，最小化映像大小
# ============================
FROM base AS runner
WORKDIR /app

# 設定為 production 模式，Next.js 會停用 debug 功能並開啟效能優化
ENV NODE_ENV=production

# 建立無 shell 登入權限的系統群組與使用者，避免以 root 身份執行容器（安全最佳實踐）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製 public 資料夾（靜態公開資源，如 favicon、圖片）
COPY --from=builder /app/public ./public

# 複製 standalone 輸出目錄（包含 server.js 和所有必要的 server 程式碼）
# 使用 --chown 確保檔案歸屬於 nextjs 使用者
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 複製靜態資源目錄（CSS、JS chunk 等前端靜態檔案）
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換到非 root 使用者執行
USER nextjs

# 宣告容器對外開放 3000 port（僅作文件說明，實際 port 映射在 docker-compose 設定）
EXPOSE 3000

# 設定 Next.js standalone server 監聽的 port 和位址
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動 Next.js standalone server
CMD ["node", "server.js"]
