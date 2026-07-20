const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
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
    .setName("구매")
    .setDescription("포인트로 상품을 구매합니다.")
    .addStringOption((option) =>
      option
        .setName("상품명")
        .setDescription("구매할 상품명")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("멘트")
        .setDescription("구매 메시지 위에 표시할 문구")
        .setRequired(true)
        .setMaxLength(20)
    )
    .addIntegerOption((option) =>
      option
        .setName("수량")
        .setDescription("구매할 수량")
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options
      .getFocused()
      .toLowerCase();

    const menu = getMenu(interaction.guildId);

    const choices = Object.entries(menu)
      .sort(
        ([, itemA], [, itemB]) =>
          Number(itemB.price) - Number(itemA.price)
      )
      .filter(([name]) =>
        name.toLowerCase().includes(focused)
      )
      .slice(0, 25)
      .map(([name, item]) => ({
        name: `${name} — ${formatNumber(item.price)} P`,
        value: name,
      }));

    try {
      await interaction.respond(choices);
    } catch (error) {
      console.error("구매 자동완성 오류:", error);
    }
  },

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    if (!settings.datingEnabled) {
      return interaction.reply({
        content: "현재 콜팅이 종료되어 있습니다.",
        ephemeral: true,
      });
    }

    const requested = normalize(
      interaction.options.getString("상품명", true)
    );

    const phrase = interaction.options
      .getString("멘트", true)
      .trim();

    const quantity =
      interaction.options.getInteger("수량") || 1;

    const menu = getMenu(interaction.guildId);

    const found = Object.keys(menu).find(
      (name) =>
        name.toLowerCase() === requested.toLowerCase()
    );

    if (!found) {
      return interaction.reply({
        content: "메뉴판에 없는 상품입니다.",
        ephemeral: true,
      });
    }

    const itemPrice = Number(menu[found].price);
    const total = itemPrice * quantity;

    if (
      !Number.isSafeInteger(total) ||
      total <= 0
    ) {
      return interaction.reply({
        content: "상품 가격 정보가 올바르지 않습니다.",
        ephemeral: true,
      });
    }

    const user = getUser(
      interaction.guildId,
      interaction.user.id
    );

    if (user.points < total) {
      return interaction.reply({
        content:
          `포인트가 부족합니다.\n` +
          `필요 포인트: **${formatNumber(total)} P**\n` +
          `보유 포인트: **${formatNumber(user.points)} P**`,
        ephemeral: true,
      });
    }

    const updated = updateUser(
      interaction.guildId,
      interaction.user.id,
      (data) => {
        data.points -= total;
        data.inventory ||= {};

        data.inventory[found] =
          (data.inventory[found] || 0) + quantity;

        return data;
      }
    );

    /*
     * 구매가 성공한 뒤 후원 순서 저장
     */
    updateGuildSettings(
      interaction.guildId,
      (guildSettings) => {
        guildSettings.purchaseHistory ||= [];

        guildSettings.purchaseHistory.push({
          userId: interaction.user.id,
          username: interaction.user.username,
          itemName: found,
          quantity,
          total,
          phrase,
          purchasedAt: Date.now(),
        });

        return guildSettings;
      }
    );

    const embed = new EmbedBuilder()
      .setColor(0xf45aa5)
      .setTitle("- 아 이 템 사 용 -")
      .setThumbnail(
        interaction.user.displayAvatarURL({
          size: 256,
        })
      )
      .addFields(
        {
          name: "구매자",
          value: `${interaction.user}`,
          inline: false,
        },
        {
          name: "아이템",
          value: `**${found}**`,
          inline: true,
        },
        {
          name: "수량",
          value: `**${quantity}개**`,
          inline: true,
        },
        {
          name: "사용 포인트",
          value: `**${formatNumber(total)} P**`,
          inline: true,
        },
        {
          name: "잔여 포인트",
          value: `**${formatNumber(updated.points)} P**`,
          inline: false,
        }
      )
      .setFooter({
        text: interaction.guild.name,
        iconURL:
          interaction.guild.iconURL({
            extension: "png",
            size: 128,
          }) ||
          interaction.client.user.displayAvatarURL({
            extension: "png",
            size: 128,
          }),
      })
      .setTimestamp();

    const channel = await getOutputChannel(interaction);

    if (channel.id === interaction.channelId) {
      return interaction.reply({
        content: `# ${phrase}`,
        embeds: [embed],
      });
    }

    await channel.send({
      content: `# ${phrase}`,
      embeds: [embed],
    });

    return interaction.reply({
      content: `${channel}에 구매 메시지를 보냈습니다.`,
      ephemeral: true,
    });
  },
};