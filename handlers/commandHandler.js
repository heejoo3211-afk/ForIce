const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = path.join(__dirname, "..", "commands");

function getFiles(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...getFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      result.push(full);
    }
  }

  return result;
}

function loadModules() {
  return getFiles(COMMANDS_DIR).map((file) => {
    delete require.cache[require.resolve(file)];
    const command = require(file);

    if (!command.data || typeof command.execute !== "function") {
      throw new Error(`잘못된 명령어 파일: ${file}`);
    }

    return command;
  });
}

function loadCommands(client) {
  const modules = loadModules();

  for (const command of modules) {
    client.commands.set(command.data.name, command);
  }

  console.log(`명령어 로드 완료: ${client.commands.size}개`);
}

function getCommandJson() {
  return loadModules().map((command) => command.data.toJSON());
}

module.exports = {
  loadCommands,
  getCommandJson,
};
