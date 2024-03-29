import fs from "fs";
import * as api from "./api.js";
import User, {
  cacheUserMapToJson,
  restoreUserMapFromCache,
  userStatus,
} from "./User.js";
import commands from "./commands.js";
import modelList from "./modelList.js";

/* TG Bot*/
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";
const admin_uid = config.admin_uid;
const bot = new TelegramBot(config.bot_token, { polling: true });
const userMap = restoreUserMapFromCache(new Map()); /*<number, User>*/ // 存储用户状态的对象，用于跟踪用户当前的操作
let mainTimer = null; // 主計時器

init();

function init() {
  // init
  if (!admin_uid) {
    writeLog("admin_uid is not set");
    return;
  }
  writeLog(`==== server start... ${new Date().toLocaleString()}  ====`);
  sendMsgToAdmin("server start...");

  // 註冊事件

  // 查看log (admin only)
  bot.onText(/\/log$/, (msg) => {
    if (msg.from.id !== admin_uid)
      return bot.sendMessage(msg.chat.id, "no permission");
    try {
      const data = fs.readFileSync("log.txt", "utf8");
      sendMsgToAdmin(data || "log is empty");
    } catch (e) {
      sendMsgToAdmin("無法讀取log，可能是空的");
      console.log("Error:", e.stack);
    }
  });

  // 清除log (admin only)
  bot.onText(/\/clearlog$/, (msg) => {
    if (msg.from.id !== admin_uid)
      return bot.sendMessage(msg.chat.id, "no permission");
    try {
      fs.unlink("log.txt", () => {
        sendMsgToAdmin("已清除log");
      });
    } catch (e) {
      console.log("Error:", e.stack);
      sendMsgToAdmin("錯誤! 請查看/log");
    }
  });

  // 移除所有user (admin only)
  bot.onText(/\/removeusers$/, (msg) => {
    if (msg.from.id !== admin_uid)
      return bot.sendMessage(msg.chat.id, "no permission");
    userMap.forEach((user) => {
      user.unsubscribe();
      bot.sendMessage(
        user.info.id,
        "系統維護中，已被自動取消訂閱，請重新訂閱 (指令: /subscribe)"
      );
    });
    userMap.clear();
    sendMsgToAdmin("已移除所有用戶");
    writeLog("==== remove all users ====");
  });

  // 列出所有user (admin only)
  bot.onText(/\/userlist$/, (msg) => {
    if (msg.from.id !== admin_uid)
      return bot.sendMessage(msg.chat.id, "no permission");

    const str = Array.from(userMap.values())
      .map((user, i) => i + 1 + ". " + user.userInfoAsString)
      .join("\n");
    sendMsgToAdmin(str || "no user.");
    writeLog("==== check all users ====");
  });

  // 開始訂閱機型現貨狀態
  bot.onText(/\/subscribe$/, (msg) => {
    const chatId = msg.chat.id;
    let user = getUserByChatId(chatId);
    if (!user) {
      user = userMap.set(chatId, new User(msg.from)).get(chatId);
    }
    user.unsubscribe();
    user.status = userStatus.waiting_for_model_name;

    bot.sendMessage(chatId, "請選擇目標機型", {
      reply_markup: {
        force_reply: true,
        inline_keyboard: modelList.map((it) => [
          {
            text: it.text,
            callback_data: it.model,
          },
        ]),
      },
    });
  });

  // 取消訂閱 (並註銷自己)
  bot.onText(/\/unsubscribe$/, (msg) => {
    const chatId = msg.chat.id;
    let user = getUserByChatId(chatId);
    if (user) {
      const infoStr = user.userInfoAsString;
      user.unsubscribe();
      userMap.delete(chatId);
      cacheUserMapToJson(userMap);
      bot.sendMessage(chatId, "您已取消訂閱");
      sendMsgToAdmin(`[user取消訂閱] ${infoStr}`);
      writeLog("==== user unsubscribe ====");
      writeLog(infoStr);
    } else {
      bot.sendMessage(chatId, "您尚未訂閱，請先訂閱機型，指令: /subscribe");
    }
  });

  // 查看當前狀態
  bot.onText(/\/status$/, (msg) => {
    let user = getUserByChatId(msg.chat.id);
    if (user) {
      let str = "未訂閱";
      if (user.isAsking) {
        str = `訂閱中...    ${user.targetDeviceModel.text}`;
      }
      bot.sendMessage(msg.chat.id, "當前狀態: " + str);
    } else {
      bot.sendMessage(
        msg.chat.id,
        "您尚未訂閱，請先訂閱機型，指令: /subscribe"
      );
    }
  });

  // callback_query 處理按鈕點擊事件
  bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.from.id;
    const user = getUserByChatId(chatId);
    if (user) {
      switch (user.status) {
        case userStatus.waiting_for_model_name: // 等待用戶選擇機型
          user.targetDeviceModel =
            modelList.find((it) => it.model === callbackQuery.data) || null;
          bot.sendMessage(
            chatId,
            `您選擇的機型是：${user.targetDeviceModel.text} (${callbackQuery.data})`
          );
          user.status = userStatus.asking_for_target_device_model;
          user.allowFindParts = true;
          cacheUserMapToJson(userMap);

          bot.sendMessage(chatId, `已開始訂閱現貨，有貨時會收到通知`);
          bot.deleteMessage(chatId, callbackQuery.message.message_id);
          bot.answerCallbackQuery(callbackQuery.id, {
            text: "訂閱成功",
            show_alert: true,
          });
          sendMsgToAdmin(`[user訂閱] ${user.userInfoAsString}`);
          writeLog("==== user subscribe ====");
          writeLog(user.userInfoAsString);
          break;
      }
    }
  });

  // 處理用戶輸入的訊息
  bot.on("message", (msg) => {
    console.log(msg);
  });

  // 開始主循環
  mainTimer = setInterval(() => {
    userMap.forEach((user) => {
      if (user.targetDeviceModel !== null) {
        api
          .getInfo(user)
          .then((info) => {
            if (info.some((it) => it.available)) {
              // 有現貨
              bot.sendSticker(
                user.chatId,
                `CAACAgIAAxkBAAEYqqFjO5e6LLUWcfnvROVXE0FRUzRdTAACoxAAAvF3qEh-OxgSw5fVQSoE`
              );
              bot.sendMessage(
                user.chatId,
                `有現貨!!!\n${user.targetDeviceModel.text}\n取消訂閱: /unsubscribe`
              );

              writeLog("==== 有現貨!!! ====");
              writeLog(user.userInfoAsString);
            }

            // 是否順便查詢相似機種
            if (user.allowFindParts) {
              api
                .getParts(user)
                .then((info) => {
                  if (info.some((it) => Object.values(it.parts).length)) {
                    if (user.lastPartsStr !== JSON.stringify(info)) {
                      user.lastPartsStr = JSON.stringify(info);
                      writeLog(`可供貨的相似機種:\n`);
                      info.forEach((it) => {
                        if (it.parts.length) {
                          writeLog(it.storeName + ":");
                          writeLog(it.parts);
                        }
                      });
                      bot.sendMessage(
                        user.chatId,
                        "可供貨的相似機種:\n" +
                          info
                            .map((it) => it.parts)
                            .flat()
                            .join("\n")
                      );
                    }
                  }
                })
                .catch((err) => {});
            }
          })
          .catch((err) => {});
      }
    });
  }, config.interval);
}

function sendMsgToAdmin(msg) {
  const fullMsg = `\`\`\`\n[admin]\n${msg}\`\`\``;
  bot.sendMessage(admin_uid, fullMsg, {
    parse_mode: "Markdown",
  });
}

function getUserByChatId(chatId) {
  return userMap.get(chatId);
}

function writeLog(msg) {
  console.log(msg);
  fs.appendFileSync(
    "log.txt",
    JSON.stringify(msg, null, 2) + "\n",
    { flag: "a" },
    (err) => {
      if (err) return console.log(err);
    }
  );
}
