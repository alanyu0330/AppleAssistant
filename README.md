# AppleAssistant 使用說明

> 一個基於 TG Bot 的 Apple 現貨通知小幫手

### 執行環境

- nodejs 版本 v14+
- 首次需要安裝依賴:

```
npm install
```

### 設定 BOT

1. 找官方 BOT 爸爸申請一個 BOT: https://t.me/BotFather
2. 到 config.js 更換 `bot_token` 為你自己的 TG Bot API Token
3. 到 config.js 更換 `admin_uid` 為你自己的 TG ID (才能收發管理員指令)
4. 找 BOT 爸爸 輸入`/setcommands` 設定以下指令集:

   ```
   subscribe - 訂閱機型現貨狀態
   unsubscribe - 取消訂閱
   status - 查看狀態
   pause - 暫停
   continue - 繼續
   log - 查看log
   clearlog - 清除log
   removeusers - 移除所有用戶
   ```

5. 完成

### 設定產品清單

- 到 `modelList.js` 編輯產品列表...
- text: 顯示名稱用
- model: 需要查詢該機型 device name

### 啟動 Server

```
npm run serve
```
