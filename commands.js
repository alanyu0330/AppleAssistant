const commands = {
  subscribe: {
    command: "/subscribe",
    description: "訂閱一個機型現貨",
  },
  unsubscribe: {
    command: "/unsubscribe",
    description: "取消訂閱",
  },
  status: {
    command: "/status",
    description: "查看狀態",
  },
  pause: {
    command: "/pause",
    description: "暫停",
  },
  continue: {
    command: "/continue",
    description: "繼續",
  },
  log: {
    command: "/log",
    description: "查看log",
  },
  clearlog: {
    command: "/clearlog",
    description: "清除log",
  },
  userlist: {
    command: "/userlist",
    description: "查看用戶列表",
  },
  removeusers: {
    command: "/removeusers",
    description: "移除所有用戶",
  },
};

function getCommandList() {
  let output = "";
  for (const key in commands) {
    if (Object.hasOwnProperty.call(commands, key)) {
      const element = commands[key];
      output += `${element.command.replace("/", "")} - ${
        element.description
      }\n`;
    }
  }
  return output;
}
console.log("TG Bot Commands:\n" + getCommandList());

export default commands;
