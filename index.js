const request = require("request");
const notifier = require("node-notifier");
const fs = require("fs");

/* TG Bot*/
const TelegramBot = require("node-telegram-bot-api");
const token = `5766612853:AAG87A4OP3fn959DKUHvhIzVLlHD_WVIPVY`;
const bot = new TelegramBot(token, { polling: true });
const uid = 407410915;

const CONF = {
  product: `iPhone 14 Pro 256GB 太空黑色`,
  productUrl: `https://www.apple.com/tw/shop/fulfillment-messages?pl=true&mts.0=regular&mts.1=compact&parts.0=MQ9U3TA/A&searchNearby=true&store=R713`,
  partsUrl: `https://www.apple.com/tw/shop/pickup-message-recommendations?mts.0=regular&mts.1=compact&searchNearby=true&store=R713&product=MQ9U3TA/A`,
};

let lastPartsStr = "";

function getInfo() {
  console.log("getInfo......", new Date().toLocaleString());
  request.get({ url: CONF.productUrl }, (err, response, res) => {
    if (response?.statusCode === 200) {
      const data = JSON.parse(res);
      const stores = data.body.content.pickupMessage.stores;
      const info = stores.map((store) => ({
        storeName: store.storeName,
        available: Object.values(store.partsAvailability).some(
          (it) => it.pickupDisplay === "available"
        ),
      }));

      if (info.some((it) => it.available)) {
        // 有現貨
        writeLog(`==========  ${new Date().toLocaleString()}  ==========`);
        writeLog("有現貨:");
        writeLog(info);
        bot.sendSticker(
          uid,
          `CAACAgIAAxkBAAEYqqFjO5e6LLUWcfnvROVXE0FRUzRdTAACoxAAAvF3qEh-OxgSw5fVQSoE`
        );
        bot.sendMessage(uid, "!!!!!!!!!有現貨!!!!!!!!!");
        notifier.notify({
          title: `有現貨: ${CONF.product}`,
          open: `https://secure4.store.apple.com/tw/shop/checkout?_s=Fulfillment-init`,
          message: info
            .filter((it) => it.available)
            .map((it) => it.storeName)
            .join(","),
        });
      }
      getParts();
    }
  });
}

function getParts() {
  request.get({ url: CONF.partsUrl }, (err, response, res) => {
    if (response?.statusCode === 200) {
      const data = JSON.parse(res);
      const stores = data.body.PickupMessage.stores;
      const info = stores.map((store) => ({
        storeName: store.storeName,
        parts: Object.values(store.partsAvailability).map(
          (it) => it.messageTypes.regular.storePickupProductTitle
        ),
      }));

      if (info.some((it) => Object.values(it.parts).length)) {
        if (lastPartsStr !== JSON.stringify(info)) {
          lastPartsStr = JSON.stringify(info);
          writeLog(`==========  ${new Date().toLocaleString()}  ==========`);
          writeLog("可供貨的相似機種:");
          info.forEach((it) => {
            writeLog(it.storeName + ":");
            writeLog(it.parts);
          });
          bot.sendMessage(
            uid,
            "可供貨的相似機種:\n" +
              info
                .map((it) => it.parts)
                .flat()
                .join("\n")
          );
        }
      }
    }
  });
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

// init
console.log("start.........");
bot.sendMessage(uid, "start...");
bot.onText(/\/log$/, (msg) => {
  try {
    const data = fs.readFileSync("log.txt", "utf8");
    bot.sendMessage(msg.chat.id, data || "empty log");
  } catch (e) {
    console.log("Error:", e.stack);
  }
});
bot.onText(/\/hello$/, (msg) => {
  bot.sendMessage(msg.chat.id, `world`);
});

getInfo();
setInterval(() => getInfo(), 4000);
