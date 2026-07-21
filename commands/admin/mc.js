const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mc")
    .setDescription("MC를 지정하거나 해제합니다.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand((subcommand) =>
      subcommand
        .setName("지정")
        .setDescription("유저를 MC로 지정합니다.")
        .addUserOption((option) =>
          option
            .setName("유저")
            .setDescription("MC로 지정할 유저")
            .setRequired(true)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("해제")
        .setDescription("유저의 MC 지정을 해제합니다.")
        .addUserOption((option) =>
          option
            .setName("유저")
            .setDescription("MC에서 해제할 유저")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "이 명령어는 관리자만 사용할 수 있습니다.",
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("유저");

    if (target.bot) {
      return interaction.reply({
        content: "봇은 MC로 지정할 수 없습니다.",
        ephemeral: true,
      });
    }

    const settings = getGuildSettings(interaction.guildId);
    const mcIds = Array.isArray(settings.mcIds) ? settings.mcIds : [];

    if (subcommand === "지정") {
      if (mcIds.includes(target.id)) {
        return interaction.reply({
          content: `${target} 님은 이미 MC로 지정되어 있습니다.`,
          ephemeral: true,
        });
      }

      updateGuildSettings(interaction.guildId, (guildSettings) => {
        guildSettings.mcIds ||= [];
        guildSettings.mcIds.push(target.id);
        return guildSettings;
      });

      return interaction.reply({
        content: `🎤 ${target} 님을 MC로 지정했습니다.`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }

    if (subcommand === "해제") {
      if (!mcIds.includes(target.id)) {
        return interaction.reply({
          content: `${target} 님은 MC로 지정되어 있지 않습니다.`,
          ephemeral: true,
        });
      }

      updateGuildSettings(interaction.guildId, (guildSettings) => {
        guildSettings.mcIds ||= [];
        guildSettings.mcIds = guildSettings.mcIds.filter(
          (userId) => userId !== target.id
        );
        return guildSettings;
      });

      return interaction.reply({
        content: `MC에서 ${target} 님을 해제했습니다.`,
        allowedMentions: {
          users: [target.id],
        },
      });
    }
  },
};