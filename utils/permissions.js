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
  // 이 유저는 모든 서버에서 최고 관리자
  if (interaction.user?.id === SUPER_ADMIN_ID) {
    return true;
  }

  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.guild?.ownerId === interaction.user?.id
  );
}

function isBotAdmin(interaction) {
  // 최고 관리자, 서버 관리자, 서버 소유자 포함
  if (isServerAdmin(interaction)) {
    return true;
  }

  const settings = getGuildSettings(interaction.guildId);
  const roleIds = getRoleIds(interaction);

  const managerUserIds = settings.managerUserIds ?? [];
  const adminRoleIds = settings.adminRoleIds ?? [];

  return (
    managerUserIds.includes(interaction.user.id) ||
    adminRoleIds.some((id) => roleIds.includes(id))
  );
}

function canManagePoints(interaction) {
  // 최고 관리자와 봇 관리자는 포인트 관리 가능
  if (isBotAdmin(interaction)) {
    return true;
  }

  const settings = getGuildSettings(interaction.guildId);
  const roleIds = getRoleIds(interaction);

  const pointRoleIds = settings.pointRoleIds ?? [];

  return pointRoleIds.some((id) => roleIds.includes(id));
}

module.exports = {
  isServerAdmin,
  isBotAdmin,
  canManagePoints,
};