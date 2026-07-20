const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getUser,
  updateUser,
  updateGuildSettings,
} = require("../../utils/database");

const {
  canManagePoints,
} = require("../../utils/permissions");

const {
  formatNumber,
  getRechargeChannel,
} = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("포인트")
    .setDescription("포인트 관리")
    .addSubcommand((s) =>
      s
        .setName("지급")
        .setDescription("포인트 지급")
        .addUserOption((o) =>
          o
            .setName("유저")
            .setDescription("대상")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName("금액")
            .setDescription("금액")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("제거")
        .setDescription("포인트 제거")
        .addUserOption((o) =>
          o
            .setName("유저")
            .setDescription("대상")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName("금액")
            .setDescription("금액")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((s) =>
      s
        .setName("조회")
        .setDescription("포인트 조회")
        .addUserOption((o) =>
          o
            .setName("유저")
            .setDescription("대상")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!canManagePoints(interaction)) {
      return interaction.reply({
        content: "권한이 없습니다.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("유저", true);

    if (sub === "조회") {
      const user = getUser(
        interaction.guildId,
        target.id
      );

      const embed = new EmbedBuilder()
        .setColor(0xf45aa5)
        .setTitle("- 포 인 트 조 회 -")
        .setThumbnail(
          target.displayAvatarURL({
            extension: "png",
            size: 256,
          })
        )
        .addFields(
          {
            name: "보유 포인트",
            value: `**${formatNumber(
              user.points
            )} 포인트**`,
          },
          {
            name: "MC 적립금",
            value: `**${formatNumber(
              user.mc
            )} 포인트**`,
          }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const amount =
      interaction.options.getInteger("금액", true);

    const updated = updateUser(
      interaction.guildId,
      target.id,
      (data) => {
        if (sub === "지급") {
          data.points += amount;
        } else {
          data.points = Math.max(
            0,
            data.points - amount
          );
        }

        return data;
      }
    );

    /*
     * 포인트 지급일 때만 콜팅 후원 기록에 저장
     */
    if (sub === "지급") {
      updateGuildSettings(
        interaction.guildId,
        (settings) => {
          settings.purchaseHistory ||= [];

          settings.purchaseHistory.push({
            userId: target.id,
            username: target.username,
            amount,
            givenBy: interaction.user.id,
            givenAt: Date.now(),
          });

          return settings;
        }
      );
    }

    const channel =
      await getRechargeChannel(interaction);

    if (sub === "지급") {
      await channel.send({
        content:
          `# ${target}님이 ` +
          `${formatNumber(amount)} 포인트를 충전하였습니다!`,
        allowedMentions: {
          users: [target.id],
        },
      });
    } else {
      await channel.send({
        content:
          `# ${target}님의 포인트에서 ` +
          `${formatNumber(amount)} 포인트를 제거하였습니다!`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }

    return interaction.reply({
      content:
        `처리 완료 · 현재 ` +
        `${formatNumber(updated.points)} 포인트`,
      ephemeral: true,
    });
  },
};