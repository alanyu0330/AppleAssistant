import fs from "fs";

export const userStatus = {
  waiting_for_model_name: "waiting_for_model_name",
  asking_for_target_device_model: "asking_for_target_device_model",
  none: null,
};

export default class User {
  constructor(userInfo, oldInfo) {
    this.info = userInfo;
    this.chatId = userInfo.id;
    this.status = oldInfo?.status ?? userStatus.none;
    this.targetDeviceModel = oldInfo?.targetDeviceModel ?? null; // { text: "iPhone 15 Pro 白色鈦金屬 128GB", model: "MTUW3ZP/A" }
    this.lastPartsStr = oldInfo?.lastPartsStr ?? "";
    this.allowFindParts = oldInfo?.allowFindParts ?? false;
  }

  unsubscribe() {
    this.status = userStatus.none;
    this.targetDeviceModel = null;
    this.lastPartsStr = "";
    this.allowFindParts = false;
  }

  get isAsking() {
    return this.status === userStatus.asking_for_target_device_model;
  }

  get userInfoAsString() {
    const basicInfo = `${this.info.username} (${this.info.id})`;
    const subscribeInfo = this.targetDeviceModel
      ? `${this.targetDeviceModel.text} (${this.targetDeviceModel.model})`
      : "未訂閱";
    return [basicInfo, subscribeInfo].join(" | ");
  }
}

export function cacheUserMapToJson(userMap) {
  if (!userMap) return;
  const userCacheFile = "./userCache.json";
  const jsonData = JSON.stringify([...userMap]);

  // 使用 fs.writeFile() 將 JSON 字串寫入檔案
  fs.writeFile(userCacheFile, jsonData, "utf8", (err) => {
    if (err) {
      console.error("寫入檔案時發生錯誤：", err);
    } else {
      console.log("檔案已成功寫入：", jsonData);
    }
  });
}

export function restoreUserMapFromCache(userMap) {
  if (!userMap) return userMap;
  const userCacheFile = "./userCache.json";
  try {
    // 使用 fs.readFileSync() 讀取檔案內容
    const data = fs.readFileSync(userCacheFile, "utf8");
    console.log("檔案內容：", data);
    if (!data) return userMap;
    userMap = new Map();
    const userListObj = JSON.parse(data);
    userListObj.forEach((it) => {
      userMap.set(it[0], new User(it[1].info, it[1]));
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      // 如果檔案不存在，則建立一個空的檔案
      fs.writeFileSync(userCacheFile, "", "utf8");
      console.log("檔案不存在，已建立一個空的檔案：", userCacheFile);
      restoreUserMapFromCache(userMap);
    } else {
      console.error("讀取檔案時發生錯誤：", err);
    }
  }
  return userMap;
}
