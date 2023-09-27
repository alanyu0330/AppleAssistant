export const userStatus = {
  waiting_for_model_name: "waiting_for_model_name",
  asking_for_target_device_model: "asking_for_target_device_model",
  none: null,
};

export default class User {
  constructor(userInfo) {
    this.info = userInfo;
    this.chatId = userInfo.id;
    this.status = userStatus.none;
    this.isPaused = true;
    this.targetDeviceModel = null; // { text: "iPhone 15 Pro 白色鈦金屬 128GB", model: "MTUW3ZP/A" }
    this.lastPartsStr = "";
    this.allowFindParts = false;
  }

  unsubscribe() {
    this.isPaused = true;
    this.status = userStatus.none;
    this.targetDeviceModel = null;
    this.lastPartsStr = "";
    this.allowFindParts = false;
  }

  get isAsking() {
    return (
      this.status === userStatus.asking_for_target_device_model &&
      !this.isPaused
    );
  }

  get userInfoAsString() {
    const basicInfo = `${this.info.username} (${this.info.id})`;
    const subscribeInfo = this.targetDeviceModel
      ? `${this.targetDeviceModel.text} (${this.targetDeviceModel.model})`
      : "未訂閱";
    return [basicInfo, subscribeInfo].join(" | ");
  }
}
