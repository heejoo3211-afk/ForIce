const { PermissionFlagsBits } = require("discord.js");
const { getGuildSettings } = require("./database");

const DEFAULT_MANAGER_ID = "1347894895649624128";

function getRoleIds(interaction) {
  const roles = interaction.member?.roles;

  if (roles?.cache) {
    return [...roles.cache.keys()];
  }

  if (Array.isArray(roles)) {
    return roles;
  }

  return [];
}

function isServerAdmin(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.guild?.ownerId === interaction.user.id
  );
}

function isBotAdmin(interaction) {
  if (isServerAdmin(interaction)) return true;

  const settings = getGuildSettings(interaction.guildId);
  const roleIds = getRoleIds(interaction);

  return (
    interaction.user.id === DEFAULT_MANAGER_ID ||
    settings.managerUserIds.includes(interaction.user.id) ||
    settings.adminRoleIds.some((id) => roleIds.includes(id))
  );
}

function canManagePoints(interaction) {
  if (isBotAdmin(interaction)) return true;

  const settings = getGuildSettings(interaction.guildId);
  const roleIds = getRoleIds(interaction);

  return settings.pointRoleIds.some((id) => roleIds.includes(id));
}

module.exports = {
  isServerAdmin,
  isBotAdmin,
  canManagePoints,
};