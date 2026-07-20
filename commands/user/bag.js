const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getGuildSettings, getUser } = require("../../utils/database");
const { formatNumber } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("가방")
    .setDescription("내 포인트를 확인합니다."),

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
      .setColor(0xF45AA5)
      .setTitle("- 내 지 갑 -")
      .setThumbnail(interaction.user.displayAvatarURL({
        extension: "png",
        size: 256,
      }))
      .addFields({
        name: "보유 포인트",
        value: `**${formatNumber(user.points)} 포인트**`,
        inline: false,
      })
      .setFooter({
        text: interaction.guild.name,
        iconURL:
          interaction.guild.iconURL({ extension: "png", size: 128 }) ||
          interaction.client.user.displayAvatarURL({
            extension: "png",
            size: 128,
          }),
      });

    // 디스코드가 위쪽에 "/가방을 사용함"을 자동 표시하므로
    // 봇은 사진처럼 임베드만 답장합니다.
    return interaction.reply({
      embeds: [embed],
    });
  },
};
