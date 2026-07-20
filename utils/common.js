const { getGuildSettings } = require("./database");

function formatNumber(value) {
  return Number(value).toLocaleString("ko-KR");
}

async function fetchConfiguredChannel(interaction, channelId) {
  if (!channelId) return null;

  const channel = await interaction.guild.channels
    .fetch(channelId)
    .catch(() => null);

  return channel?.isTextBased() ? channel : null;
}

async function getOutputChannel(interaction) {
  const settings = getGuildSettings(interaction.guildId);
  return (
    (await fetchConfiguredChannel(interaction, settings.outputChannelId)) ||
    interaction.channel
  );
}

async function getRechargeChannel(interaction) {
  const settings = getGuildSettings(interaction.guildId);
  return (
    (await fetchConfiguredChannel(interaction, settings.rechargeChannelId)) ||
    (await getOutputChannel(interaction))
  );
}

function normalize(value) {
  return value.trim().replace(/\s+/g, " ");
}

module.exports = {
  formatNumber,
  getOutputChannel,
  getRechargeChannel,
  normalize,
};
