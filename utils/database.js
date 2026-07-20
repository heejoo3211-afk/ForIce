const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

const FILES = {
  users: path.join(DATA_DIR, "users.json"),
  settings: path.join(DATA_DIR, "settings.json"),
  menu: path.join(DATA_DIR, "menu.json"),
};

const DEFAULT_SETTINGS = {
  adminRoleIds: [],
  pointRoleIds: [],
  managerUserIds: [],
  outputChannelId: null,
  rechargeChannelId: null,
  panelChannelId: null,
  panelMessageId: null,
  datingEnabled: false,

  // 콜팅 중 구매한 순서를 저장
  purchaseHistory: [],
};

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "{}\n", "utf8");
    }
  }
}

function read(file) {
  ensure();

  try {
    const raw = fs.readFileSync(file, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(`${path.basename(file)} 읽기 오류:`, error);
    return {};
  }
}

function write(file, value) {
  ensure();

  fs.writeFileSync(
    file,
    JSON.stringify(value, null, 2) + "\n",
    "utf8"
  );
}

function getGuildSettings(guildId) {
  const all = read(FILES.settings);

  if (!all[guildId]) {
    all[guildId] = {
      ...DEFAULT_SETTINGS,
      purchaseHistory: [],
    };

    write(FILES.settings, all);
  }

  return {
    ...DEFAULT_SETTINGS,
    ...all[guildId],
    purchaseHistory: Array.isArray(all[guildId].purchaseHistory)
      ? all[guildId].purchaseHistory
      : [],
  };
}

function updateGuildSettings(guildId, updater) {
  const all = read(FILES.settings);

  const current = {
    ...DEFAULT_SETTINGS,
    ...(all[guildId] || {}),
    purchaseHistory: Array.isArray(
      all[guildId]?.purchaseHistory
    )
      ? all[guildId].purchaseHistory
      : [],
  };

  all[guildId] = updater(current) || current;

  write(FILES.settings, all);

  return all[guildId];
}

function getUser(guildId, userId) {
  const all = read(FILES.users);

  all[guildId] ||= {};

  if (!all[guildId][userId]) {
    all[guildId][userId] = {
      points: 0,
      mc: 0,
      inventory: {},
    };

    write(FILES.users, all);
  }

  return all[guildId][userId];
}

function updateUser(guildId, userId, updater) {
  const all = read(FILES.users);

  all[guildId] ||= {};

  const current = all[guildId][userId] || {
    points: 0,
    mc: 0,
    inventory: {},
  };

  all[guildId][userId] = updater(current) || current;

  write(FILES.users, all);

  return all[guildId][userId];
}

function getMenu(guildId) {
  const all = read(FILES.menu);
  return all[guildId] || {};
}

function updateMenu(guildId, updater) {
  const all = read(FILES.menu);
  const current = all[guildId] || {};

  all[guildId] = updater(current) || current;

  write(FILES.menu, all);

  return all[guildId];
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  getUser,
  updateUser,
  getMenu,
  updateMenu,
};