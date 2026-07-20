const { SlashCommandBuilder } = require("discord.js");
const { getGuildSettings, getUser, updateUser } = require("../../utils/database");
const { formatNumber, getOutputChannel } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc적립")
    .setDescription("포인트를 MC 적립금으로 옮깁니다.")
    .addIntegerOption((o) =>
      o.setName("금액").setDescription("금액").setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    const amount = interaction.options.getInteger("금액", true);
    const user = getUser(interaction.guildId, interaction.user.id);

    if (user.points < amount) {
      return interaction.reply({
        content: "포인트가 부족합니다.",
        ephemeral: true,
      });
    }

    updateUser(interaction.guildId, interaction.user.id, (data) => {
      data.points -= amount;
      data.mc += amount;
      return data;
    });

    const channel = await getOutputChannel(interaction);
    await channel.send(
      `# MC 적립 완료\n${interaction.user}님이 MC 적립금에 **+${formatNumber(amount)}P**를 반영했습니다.`
    );

    return interaction.reply({
      content: "MC 적립 완료",
      ephemeral: true,
    });
  },
};
