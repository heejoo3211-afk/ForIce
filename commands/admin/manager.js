const { SlashCommandBuilder } = require("discord.js");
const { updateGuildSettings } = require("../../utils/database");
const { isBotAdmin } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("매니저")
    .setDescription("매니저 관리")
    .addSubcommand((s) =>
      s.setName("임명").setDescription("매니저 임명")
        .addUserOption((o) => o.setName("유저").setDescription("대상").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("해임").setDescription("매니저 해임")
        .addUserOption((o) => o.setName("유저").setDescription("대상").setRequired(true))
    ),

  async execute(interaction) {
    if (!isBotAdmin(interaction)) {
      return interaction.reply({
        content: "권한이 없습니다.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("유저", true);

    updateGuildSettings(interaction.guildId, (settings) => {
      const ids = new Set(settings.managerUserIds);

      if (sub === "임명") ids.add(target.id);
      else ids.delete(target.id);

      settings.managerUserIds = [...ids];
      return settings;
    });

    return interaction.reply({
      content: `${target}님 매니저 ${sub} 완료`,
      ephemeral: true,
    });
  },
};
