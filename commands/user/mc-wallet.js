const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getGuildSettings,
  getUser,
} = require("../../utils/database");

const {
  formatNumber,
} = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc지갑")
    .setDescription("현재 MC의 적립금을 확인합니다."),

  async execute(interaction) {
    const settings = getGuildSettings(
      interaction.guildId
    );

    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    if (!settings.currentMcId) {
      return interaction.reply({
        content: "현재 지정된 MC가 없습니다.",
        ephemeral: true,
      });
    }

    const target =
      await interaction.client.users.fetch(
        settings.currentMcId
      );

    const user = getUser(
      interaction.guildId,
      settings.currentMcId
    );

    const embed = new EmbedBuilder()
      .setTitle("MC 지갑")
      .setThumbnail(
        target.displayAvatarURL({
          extension: "png",
          size: 256,
        })
      )
      .setDescription(
        `${target}님의 MC 적립금: **${formatNumber(
          user.mc
        )}P**`
      );

    return interaction.reply({
      embeds: [embed],
    });
  },
};