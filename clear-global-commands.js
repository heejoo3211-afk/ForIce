require("dotenv").config();

const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN
);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );

    console.log("기존 전역 명령어를 모두 삭제했습니다.");
  } catch (error) {
    console.error("전역 명령어 삭제 실패:", error);
  }
})();