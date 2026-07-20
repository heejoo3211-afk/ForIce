const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getGuildSettings, getMenu } = require("../../utils/database");
const { formatNumber } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("메뉴판")
    .setDescription("현재 상품 목록을 확인합니다."),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);
    
    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    const menu = getMenu(interaction.guildId);
    const entries = Object.entries(menu);

    const description = entries.length
      ? entries
          .sort((a, b) => b[1].price - a[1].price)
          .map(([name, item]) => `**${name}** — ${formatNumber(item.price)}P${item.description ? `\n${item.description}` : ""}`)
          .join("\n\n")
      : "등록된 상품이 없습니다.";

    const embed = new EmbedBuilder()
      .setTitle("메뉴판")
      .setDescription(description);

    return interaction.reply({ embeds: [embed] });
  },
};
