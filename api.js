import request from "request";

// 查詢指定機種
export function getInfo(user) {
  return new Promise((resolve, reject) => {
    console.log("getInfo......", new Date().toLocaleString());
    request.get(
      {
        url: `https://www.apple.com/tw/shop/fulfillment-messages?store=R713&little=false&parts.0=${user.targetDeviceModel.model}&mts.0=regular&mts.1=sticky&fts=true`,
      },
      (err, response, res) => {
        if (err) return reject(err);
        if (response?.statusCode === 200) {
          try {
            const data = JSON.parse(res);
            const stores = data?.body?.content?.pickupMessage?.stores || [];
            const info = stores.map((store) => ({
              storeName: store.storeName,
              available: Object.values(store.partsAvailability).some(
                (it) => it.pickupDisplay === "available"
              ),
            }));
            return resolve(info);
          } catch (error) {
            console.error(error);
            return reject(error);
          }
        } else {
          reject("statusCode is not 200");
          console.log("statusCode is not 200");
          if (response?.statusCode === 529) {
            console.log("statusCode is 529 伺服器過載");
          }
        }
      }
    );
  });
}

// 查詢相似機種
export function getParts(user) {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: `https://www.apple.com/tw/shop/pickup-message-recommendations?mts.0=regular&mts.1=compact&searchNearby=true&store=R713&product=${user.targetDeviceModel.model}`,
      },
      (err, response, res) => {
        if (err) return reject(err);
        if (response?.statusCode === 200) {
          try {
            const data = JSON.parse(res);
            const stores = data?.body?.PickupMessage?.stores || [];
            const info = stores.map((store) => ({
              storeName: store.storeName,
              parts: Object.values(store.partsAvailability).map(
                (it) => it.messageTypes.regular.storePickupProductTitle
              ),
            }));
            return resolve(info);
          } catch (error) {
            console.error(error);
            return reject(error);
          }
        } else {
          reject("statusCode is not 200");
          console.log("statusCode is not 200");
          if (response?.statusCode === 529) {
            console.log("statusCode is 529 伺服器過載");
          }
        }
      }
    );
  });
}
