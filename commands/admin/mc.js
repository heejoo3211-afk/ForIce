const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc")
    .setDescription("MC를 지정하거나 해제합니다.")
    
    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("실행할 작업")
        .setRequired(true)
        .addChoices(
          {
            name: "지정",
            value: "지정",
          },
          {
            name: "해제",
            value: "해제",
          }
        )
    )
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("MC 대상")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { isBotAdmin } = require("../../utils/permissions");

if (!isBotAdmin(interaction)) {
  return interaction.reply({
    content: "관리자만 사용할 수 있습니다.",
    ephemeral: true,
  });
} {
      return interaction.reply({
        content: "관리자만 사용할 수 있습니다.",
        ephemeral: true,
      });
    }

    const action =
      interaction.options.getString("작업", true);

    const target =
      interaction.options.getUser("유저", true);

    if (target.bot) {
      return interaction.reply({
        content: "봇은 MC가 될 수 없습니다.",
        ephemeral: true,
      });
    }

    if (action === "지정") {
      updateGuildSettings(
        interaction.guildId,
        (settings) => {
          settings.currentMcId = target.id;
          settings.mcIds = [target.id];
          return settings;
        }
      );

      return interaction.reply({
        content: `🎤 ${target} 님을 새로운 MC로 지정했습니다.`,
      });
    }

    const settings = getGuildSettings(
      interaction.guildId
    );

    if (settings.currentMcId !== target.id) {
      return interaction.reply({
        content: "현재 MC가 아닙니다.",
        ephemeral: true,
      });
    }

    updateGuildSettings(
      interaction.guildId,
      (settings) => {
        settings.currentMcId = null;
        settings.mcIds = [];
        return settings;
      }
    );

    return interaction.reply({
      content: `${target} 님의 MC를 해제했습니다.`,
    });
  },
};