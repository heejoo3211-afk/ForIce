const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

const { isServerAdmin } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("설정")
    .setDescription("봇 설정")
    .addSubcommand((s) =>
      s.setName("관리자역할추가").setDescription("관리자 역할 추가")
        .addRoleOption((o) =>
          o.setName("역할").setDescription("역할").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("관리자역할제거").setDescription("관리자 역할 제거")
        .addRoleOption((o) =>
          o.setName("역할").setDescription("역할").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("포인트역할추가").setDescription("포인트 역할 추가")
        .addRoleOption((o) =>
          o.setName("역할").setDescription("역할").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("포인트역할제거").setDescription("포인트 역할 제거")
        .addRoleOption((o) =>
          o.setName("역할").setDescription("역할").setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("출력채널").setDescription("구매 및 일반 출력 채널 설정")
        .addChannelOption((o) =>
          o.setName("채널")
            .setDescription("출력 채널")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement
            )
        )
    )
    .addSubcommand((s) =>
      s.setName("충전메시지채널").setDescription("포인트 충전 메시지 채널 설정")
        .addChannelOption((o) =>
          o.setName("채널")
            .setDescription("충전 내역을 보낼 채널")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement
            )
        )
    )
    .addSubcommand((s) =>
      s.setName("확인").setDescription("현재 설정 확인")
    ),

  async execute(interaction) {
    if (!isServerAdmin(interaction)) {
      return interaction.reply({
        content: "서버 관리자만 사용할 수 있습니다.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "확인") {
      const settings = getGuildSettings(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle("현재 설정")
        .addFields(
          {
            name: "관리자 역할",
            value: settings.adminRoleIds.length
              ? settings.adminRoleIds.map((id) => `<@&${id}>`).join(", ")
              : "없음",
          },
          {
            name: "포인트 역할",
            value: settings.pointRoleIds.length
              ? settings.pointRoleIds.map((id) => `<@&${id}>`).join(", ")
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
              settings.panelChannelId && settings.panelMessageId
                ? `<#${settings.panelChannelId}>에 전송됨`
                : "전송되지 않음",
          },
          {
            name: "콜팅 상태",
            value: settings.datingEnabled ? "진행 중" : "종료",
          }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (sub === "출력채널" || sub === "충전메시지채널") {
      const channel = interaction.options.getChannel("채널", true);

      updateGuildSettings(interaction.guildId, (settings) => {
        if (sub === "출력채널") {
          settings.outputChannelId = channel.id;
        } else {
          settings.rechargeChannelId = channel.id;
        }

        return settings;
      });

      return interaction.reply({
        content:
          sub === "출력채널"
            ? `일반 출력 채널을 ${channel}(으)로 설정했습니다.`
            : `충전 메시지 채널을 ${channel}(으)로 설정했습니다.`,
        ephemeral: true,
      });
    }

    const role = interaction.options.getRole("역할", true);
    const key = sub.startsWith("관리자")
      ? "adminRoleIds"
      : "pointRoleIds";
    const add = sub.endsWith("추가");

    updateGuildSettings(interaction.guildId, (settings) => {
      const ids = new Set(settings[key]);

      if (add) ids.add(role.id);
      else ids.delete(role.id);

      settings[key] = [...ids];
      return settings;
    });

    return interaction.reply({
      content: `${role} 역할 ${add ? "추가" : "제거"} 완료`,
      ephemeral: true,
    });
  },
};
