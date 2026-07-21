const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getGuildSettings,
  getMenu,
  getUser,
  updateUser,
} = require("../../utils/database");

const {
  formatNumber,
  getOutputChannel,
  normalize,
} = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc구매")
    .setDescription("현재 MC 적립금으로 상품을 구매합니다.")
    .addStringOption((option) =>
      option
        .setName("상품명")
        .setDescription("상품명")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("멘트")
        .setDescription("공개 멘트")
        .setRequired(true)
        .setMaxLength(20)
    )
    .addIntegerOption((option) =>
      option
        .setName("수량")
        .setDescription("수량")
        .setMinValue(1)
        .setMaxValue(100)
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

    const requested = normalize(
      interaction.options.getString("상품명", true)
    );

    const phrase =
      interaction.options.getString("멘트", true);

    const quantity =
      interaction.options.getInteger("수량") || 1;

    const menu = getMenu(interaction.guildId);

    const found = Object.keys(menu).find(
      (name) =>
        name.toLowerCase() ===
        requested.toLowerCase()
    );

    if (!found) {
      return interaction.reply({
        content: "메뉴판에 없는 상품입니다.",
        ephemeral: true,
      });
    }

    const total =
      menu[found].price * quantity;

    const mcUser = getUser(
      interaction.guildId,
      currentMcId
    );

    if (mcUser.mc < total) {
      return interaction.reply({
        content: "MC 적립금이 부족합니다.",
        ephemeral: true,
      });
    }

    const updated = updateUser(
      interaction.guildId,
      currentMcId,
      (data) => {
        data.mc -= total;

        data.inventory ||= {};
        data.inventory[found] =
          (data.inventory[found] || 0) +
          quantity;

        return data;
      }
    );

    const embed = new EmbedBuilder()
      .setTitle("MC 구매 완료")
      .addFields(
        {
          name: "상품",
          value: found,
          inline: true,
        },
        {
          name: "수량",
          value: `${quantity}개`,
          inline: true,
        },
        {
          name: "사용 MC",
          value: `${formatNumber(total)}P`,
          inline: true,
        },
        {
          name: "남은 MC",
          value: `${formatNumber(updated.mc)}P`,
          inline: true,
        }
      );

    const channel =
      await getOutputChannel(interaction);

    await channel.send({
      content: `# ${phrase}\n<@${currentMcId}>`,
      embeds: [embed],
      allowedMentions: {
        users: [currentMcId],
      },
    });

    return interaction.reply({
      content: "MC 구매 완료",
      ephemeral: true,
    });
  },
};