const { SlashCommandBuilder } = require("discord.js");
const { updateGuildSettings } = require("../../utils/database");
const { isBotAdmin } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("매니저")
    .setDescription("매니저 관리")
    .addStringOption((option) =>
      option
        .setName("작업")
        .setDescription("실행할 작업을 선택하세요.")
        .setRequired(true)
        .addChoices(
          {
            name: "임명",
            value: "임명",
          },
          {
            name: "해임",
            value: "해임",
          }
        )
    )
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("대상")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isBotAdmin(interaction)) {
      return interaction.reply({
        content: "권한이 없습니다.",
        ephemeral: true,
      });
    }

    const action =
      interaction.options.getString("작업", true);

    const target =
      interaction.options.getUser("유저", true);

    updateGuildSettings(
      interaction.guildId,
      (settings) => {
        const ids = new Set(
          settings.managerUserIds || []
        );

        if (action === "임명") {
          ids.add(target.id);
        } else {
          ids.delete(target.id);
        }

        settings.managerUserIds = [...ids];
        return settings;
      }
    );

    return interaction.reply({
      content: `${target}님 매니저 ${action} 완료`,
      ephemeral: true,
    });
  },
};