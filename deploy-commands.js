require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { getCommandJson } = require("./handlers/commandHandler");

const required = ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`.env에 값이 없습니다: ${missing.join(", ")}`);
  process.exit(1);
}

const commands = getCommandJson();
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`명령어 등록 완료: ${commands.length}개`);
    console.log(commands.map((c) => `/${c.name}`).join(", "));
  } catch (error) {
    console.error("명령어 등록 실패:", error);
    process.exit(1);
  }
})();
