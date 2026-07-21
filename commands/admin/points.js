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
    .setDescription("포인트를 지급, 제거하거나 조회합니다.")
    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("실행할 작업을 선택하세요.")
        .setRequired(true)
        .addChoices(
          {
            name: "지급",
            value: "지급",
          },
          {
            name: "제거",
            value: "제거",
          },
          {
            name: "조회",
            value: "조회",
          }
        )
    )
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("대상 유저")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("금액")
        .setDescription("지급하거나 제거할 포인트")
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!canManagePoints(interaction)) {
      return interaction.reply({
        content: "권한이 없습니다.",
        ephemeral: true,
      });
    }

    const action =
      interaction.options.getString("작업", true);

    const target =
      interaction.options.getUser("유저", true);

    /*
     * 포인트 조회
     */
    if (action === "조회") {
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

    /*
     * 지급·제거일 때 금액 필수 확인
     */
    const amount =
      interaction.options.getInteger("금액");

    if (!amount) {
      return interaction.reply({
        content:
          `포인트 ${action} 작업에는 금액을 입력해야 합니다.`,
        ephemeral: true,
      });
    }

    const updated = updateUser(
      interaction.guildId,
      target.id,
      (data) => {
        if (action === "지급") {
          data.points += amount;
        }

        if (action === "제거") {
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
    if (action === "지급") {
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

    if (action === "지급") {
      await channel.send({
        content:
          `# ${target}님이 ` +
          `${formatNumber(amount)} 포인트를 충전하였습니다!`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }

    if (action === "제거") {
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