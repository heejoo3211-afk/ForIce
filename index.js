require("dotenv").config();

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
} = require("discord.js");

const { loadCommands } = require("./handlers/commandHandler");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

loadCommands(client);

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 자동완성
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command || typeof command.autocomplete !== "function") {
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error("자동완성 오류:", error);

        if (!interaction.responded) {
          await interaction.respond([]).catch(() => {});
        }
      }

      return;
    }

    // 슬래시 명령어
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    await command.execute(interaction);

  } catch (error) {
    console.error("명령어 실행 오류:", error);

    const payload = {
      content: "처리 중 오류가 발생했습니다.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`로그인 완료: ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);