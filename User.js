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
    this.targetDeviceModel = null;
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
}
