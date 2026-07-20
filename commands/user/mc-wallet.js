const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getGuildSettings, getUser } = require("../../utils/database");
const { formatNumber } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc지갑")
    .setDescription("내 MC 적립금을 확인합니다."),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    const user = getUser(interaction.guildId, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("MC 지갑")
      .setDescription(`${interaction.user}님의 MC 적립금: **${formatNumber(user.mc)}P**`);

    return interaction.reply({ embeds: [embed] });
  },
};
