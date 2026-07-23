const { PermissionFlagsBits } = require("discord.js");
const { getGuildSettings } = require("./database");

const SUPER_ADMIN_ID = "1347894895649624128";

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
  // 지정한 유저는 무조건 최고 관리자
  if (interaction.user.id === SUPER_ADMIN_ID) {
    return true;
  }

  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.guild?.ownerId === interaction.user.id
  );
}

function isBotAdmin(interaction) {
  // isServerAdmin 안에 최고 관리자 ID도 포함됨
  if (isServerAdmin(interaction)) return true;

  const settings = getGuildSettings(interaction.guildId);
  const roleIds = getRoleIds(interaction);

  return (
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