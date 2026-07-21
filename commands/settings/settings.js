const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

const {
  isServerAdmin,
} = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("설정")
    .setDescription("봇 설정을 관리합니다.")

    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("실행할 설정 작업")
        .setRequired(true)
        .addChoices(
          {
            name: "관리자 역할 추가",
            value: "관리자역할추가",
          },
          {
            name: "관리자 역할 제거",
            value: "관리자역할제거",
          },
          {
            name: "포인트 역할 추가",
            value: "포인트역할추가",
          },
          {
            name: "포인트 역할 제거",
            value: "포인트역할제거",
          },
          {
            name: "출력 채널 설정",
            value: "출력채널",
          },
          {
            name: "충전 메시지 채널 설정",
            value: "충전메시지채널",
          },
          {
            name: "현재 설정 확인",
            value: "확인",
          }
        )
    )

    .addRoleOption((option) =>
      option
        .setName("역할")
        .setDescription("추가하거나 제거할 역할")
        .setRequired(false)
    )

    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("설정할 채널")
        .setRequired(false)
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement
        )
    ),

  async execute(interaction) {
    if (!isServerAdmin(interaction)) {
      return interaction.reply({
        content: "서버 관리자만 사용할 수 있습니다.",
        ephemeral: true,
      });
    }

    const action =
      interaction.options.getString("작업", true);

    /*
     * 현재 설정 확인
     */
    if (action === "확인") {
      const settings = getGuildSettings(
        interaction.guildId
      );

      const adminRoleIds = Array.isArray(
        settings.adminRoleIds
      )
        ? settings.adminRoleIds
        : [];

      const pointRoleIds = Array.isArray(
        settings.pointRoleIds
      )
        ? settings.pointRoleIds
        : [];

      const embed = new EmbedBuilder()
        .setColor(0xf45aa5)
        .setTitle("현재 설정")
        .addFields(
          {
            name: "관리자 역할",
            value: adminRoleIds.length
              ? adminRoleIds
                  .map((id) => `<@&${id}>`)
                  .join(", ")
              : "없음",
          },
          {
            name: "포인트 역할",
            value: pointRoleIds.length
              ? pointRoleIds
                  .map((id) => `<@&${id}>`)
                  .join(", ")
              : "없음",
          },
          {
            name: "일반 출력 채널",
            value: settings.outputChannelId
              ? `<#${settings.outputChannelId}>`
              : "없음",
          },
          {
            name: "충전 메시지 채널",
            value: settings.rechargeChannelId
              ? `<#${settings.rechargeChannelId}>`
              : "없음",
          },
          {
            name: "패널 위치",
            value:
              settings.panelChannelId &&
              settings.panelMessageId
                ? `<#${settings.panelChannelId}>에 전송됨`
                : "전송되지 않음",
          },
          {
            name: "콜팅 상태",
            value: settings.datingEnabled
              ? "진행 중"
              : "종료",
          }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    /*
     * 채널 설정
     */
    if (
      action === "출력채널" ||
      action === "충전메시지채널"
    ) {
      const channel =
        interaction.options.getChannel("채널");

      if (!channel) {
        return interaction.reply({
          content: "채널을 선택해야 합니다.",
          ephemeral: true,
        });
      }

      updateGuildSettings(
        interaction.guildId,
        (settings) => {
          if (action === "출력채널") {
            settings.outputChannelId =
              channel.id;
          }

          if (
            action === "충전메시지채널"
          ) {
            settings.rechargeChannelId =
              channel.id;
          }

          return settings;
        }
      );

      return interaction.reply({
        content:
          action === "출력채널"
            ? `일반 출력 채널을 ${channel}(으)로 설정했습니다.`
            : `충전 메시지 채널을 ${channel}(으)로 설정했습니다.`,
        ephemeral: true,
      });
    }

    /*
     * 역할 설정
     */
    const role =
      interaction.options.getRole("역할");

    if (!role) {
      return interaction.reply({
        content: "역할을 선택해야 합니다.",
        ephemeral: true,
      });
    }

    const isAdminRole =
      action.startsWith("관리자");

    const isAdd =
      action.endsWith("추가");

    const key = isAdminRole
      ? "adminRoleIds"
      : "pointRoleIds";

    const label = isAdminRole
      ? "관리자 역할"
      : "포인트 역할";

    const settings = getGuildSettings(
      interaction.guildId
    );

    const currentIds = Array.isArray(
      settings[key]
    )
      ? settings[key]
      : [];

    if (
      isAdd &&
      currentIds.includes(role.id)
    ) {
      return interaction.reply({
        content: `${role} 역할은 이미 ${label}로 등록되어 있습니다.`,
        ephemeral: true,
      });
    }

    if (
      !isAdd &&
      !currentIds.includes(role.id)
    ) {
      return interaction.reply({
        content: `${role} 역할은 ${label}로 등록되어 있지 않습니다.`,
        ephemeral: true,
      });
    }

    updateGuildSettings(
      interaction.guildId,
      (settings) => {
        const ids = new Set(
          Array.isArray(settings[key])
            ? settings[key]
            : []
        );

        if (isAdd) {
          ids.add(role.id);
        } else {
          ids.delete(role.id);
        }

        settings[key] = [...ids];

        return settings;
      }
    );

    return interaction.reply({
      content:
        `${role} 역할을 ${label}에서 ` +
        `${isAdd ? "추가" : "제거"}했습니다.`,
      ephemeral: true,
    });
  },
};