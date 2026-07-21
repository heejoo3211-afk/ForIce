const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc")
    .setDescription("MC를 지정하거나 해제합니다.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("실행할 작업을 선택하세요.")
        .setRequired(true)
        .addChoices(
          {
            name: "지정",
            value: "지정",
          },
          {
            name: "해제",
            value: "해제",
          }
        )
    )
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("지정하거나 해제할 유저")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (
      !interaction.memberPermissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        content:
          "이 명령어는 관리자만 사용할 수 있습니다.",
        ephemeral: true,
      });
    }

    const action =
      interaction.options.getString("작업", true);

    const target =
      interaction.options.getUser("유저", true);

    if (target.bot) {
      return interaction.reply({
        content: "봇은 MC로 지정할 수 없습니다.",
        ephemeral: true,
      });
    }

    const settings = getGuildSettings(
      interaction.guildId
    );

    const mcIds = Array.isArray(settings.mcIds)
      ? settings.mcIds
      : [];

    /*
     * MC 지정
     */
    if (action === "지정") {
      if (mcIds.includes(target.id)) {
        return interaction.reply({
          content:
            `${target} 님은 이미 MC로 지정되어 있습니다.`,
          ephemeral: true,
        });
      }

      updateGuildSettings(
        interaction.guildId,
        (guildSettings) => {
          guildSettings.mcIds ||= [];

          if (
            !guildSettings.mcIds.includes(target.id)
          ) {
            guildSettings.mcIds.push(target.id);
          }

          return guildSettings;
        }
      );

      return interaction.reply({
        content:
          `🎤 ${target} 님을 MC로 지정했습니다.`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }

    /*
     * MC 해제
     */
    if (action === "해제") {
      if (!mcIds.includes(target.id)) {
        return interaction.reply({
          content:
            `${target} 님은 MC로 지정되어 있지 않습니다.`,
          ephemeral: true,
        });
      }

      updateGuildSettings(
        interaction.guildId,
        (guildSettings) => {
          guildSettings.mcIds = Array.isArray(
            guildSettings.mcIds
          )
            ? guildSettings.mcIds.filter(
                (userId) => userId !== target.id
              )
            : [];

          return guildSettings;
        }
      );

      return interaction.reply({
        content:
          `MC에서 ${target} 님을 해제했습니다.`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }
  },
};