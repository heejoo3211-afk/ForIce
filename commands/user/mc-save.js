const { SlashCommandBuilder } = require("discord.js");

const {
  getGuildSettings,
  getUser,
  updateUser,
} = require("../../utils/database");

const {
  formatNumber,
  getOutputChannel,
} = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc적립")
    .setDescription("현재 MC에게 포인트를 적립합니다.")
    .addIntegerOption((option) =>
      option
        .setName("금액")
        .setDescription("적립할 포인트")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    const currentMcId =
      settings.currentMcId || settings.mcIds?.[0];

    if (!currentMcId) {
      return interaction.reply({
        content: "현재 지정된 MC가 없습니다.",
        ephemeral: true,
      });
    }

    const amount =
      interaction.options.getInteger("금액", true);

    // 적립하는 사람
    const sender = getUser(
      interaction.guildId,
      interaction.user.id
    );

    if (sender.points < amount) {
      return interaction.reply({
        content: "포인트가 부족합니다.",
        ephemeral: true,
      });
    }

    // 적립하는 사람 포인트 차감
    updateUser(
      interaction.guildId,
      interaction.user.id,
      (data) => {
        data.points -= amount;
        return data;
      }
    );

    // 현재 MC 적립금 증가
    const mcUser = updateUser(
      interaction.guildId,
      currentMcId,
      (data) => {
        data.mc += amount;
        return data;
      }
    );

    const channel =
      await getOutputChannel(interaction);

    await channel.send({
      content:
        `# MC 적립 완료\n` +
        `${interaction.user}님이 <@${currentMcId}>님의 MC 적립금에 **+${formatNumber(amount)}P**를 적립했습니다.\n` +
        `현재 MC 적립금 : **${formatNumber(mcUser.mc)}P**`,
      allowedMentions: {
        users: [
          interaction.user.id,
          currentMcId,
        ],
      },
    });

    return interaction.reply({
      content: "MC 적립이 완료되었습니다.",
      ephemeral: true,
    });
  },
};