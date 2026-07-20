const { SlashCommandBuilder } = require("discord.js");
const { getMenu, updateMenu } = require("../../utils/database");
const { isBotAdmin } = require("../../utils/permissions");
const { normalize, formatNumber } = require("../../utils/common");

// 가격이 높은 상품부터 정렬
function sortMenuByPrice(items) {
  return Object.fromEntries(
    Object.entries(items).sort(([, a], [, b]) => {
      return Number(b.price) - Number(a.price);
    })
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("메뉴")
    .setDescription("메뉴 관리")

    .addSubcommand((s) =>
      s
        .setName("추가")
        .setDescription("상품 추가")
        .addStringOption((o) =>
          o
            .setName("상품명")
            .setDescription("상품명")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName("가격")
            .setDescription("가격")
            .setRequired(true)
            .setMinValue(0)
        )
        .addStringOption((o) =>
          o
            .setName("설명")
            .setDescription("설명")
        )
    )

    .addSubcommand((s) =>
      s
        .setName("삭제")
        .setDescription("상품 삭제")
        .addStringOption((o) =>
          o
            .setName("상품명")
            .setDescription("상품명")
            .setRequired(true)
        )
    )

    .addSubcommand((s) =>
      s
        .setName("수정")
        .setDescription("상품 수정")
        .addStringOption((o) =>
          o
            .setName("상품명")
            .setDescription("기존 상품명")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("새이름")
            .setDescription("새 이름")
        )
        .addIntegerOption((o) =>
          o
            .setName("새가격")
            .setDescription("새 가격")
            .setMinValue(0)
        )
        .addStringOption((o) =>
          o
            .setName("새설명")
            .setDescription("새 설명")
        )
    ),

  async execute(interaction) {
    if (!isBotAdmin(interaction)) {
      return interaction.reply({
        content: "권한이 없습니다.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const requested = normalize(
      interaction.options.getString("상품명", true)
    );

    const menu = getMenu(interaction.guildId);

    const found = Object.keys(menu).find(
      (name) => name.toLowerCase() === requested.toLowerCase()
    );

    // 상품 추가
    if (sub === "추가") {
      if (found) {
        return interaction.reply({
          content: "이미 있는 상품입니다.",
          ephemeral: true,
        });
      }

      const price = interaction.options.getInteger("가격", true);
      const description =
        interaction.options.getString("설명") || "";

      updateMenu(interaction.guildId, (items) => {
        items[requested] = {
          price,
          description,
        };

        // 추가 후 비싼 순서대로 다시 정렬
        return sortMenuByPrice(items);
      });

      return interaction.reply({
        content: `상품 추가 완료: ${requested} (${formatNumber(price)}P)`,
        ephemeral: true,
      });
    }

    if (!found) {
      return interaction.reply({
        content: "상품을 찾을 수 없습니다.",
        ephemeral: true,
      });
    }

    // 상품 삭제
    if (sub === "삭제") {
      updateMenu(interaction.guildId, (items) => {
        delete items[found];

        // 삭제 후에도 가격순 유지
        return sortMenuByPrice(items);
      });

      return interaction.reply({
        content: `상품 삭제 완료: ${found}`,
        ephemeral: true,
      });
    }

    // 상품 수정
    const newName = normalize(
      interaction.options.getString("새이름") || found
    );

    const newPrice =
      interaction.options.getInteger("새가격");

    const newDescription =
      interaction.options.getString("새설명");

    // 다른 기존 상품 이름과 겹치는지 확인
    const duplicateName = Object.keys(menu).find(
      (name) =>
        name.toLowerCase() === newName.toLowerCase() &&
        name !== found
    );

    if (duplicateName) {
      return interaction.reply({
        content: "변경하려는 이름과 같은 상품이 이미 있습니다.",
        ephemeral: true,
      });
    }

    updateMenu(interaction.guildId, (items) => {
      const old = items[found];

      delete items[found];

      items[newName] = {
        price: newPrice ?? old.price,
        description: newDescription ?? old.description,
      };

      // 가격을 수정한 뒤 비싼 순서대로 재정렬
      return sortMenuByPrice(items);
    });

    return interaction.reply({
      content: `상품 수정 완료: ${found} → ${newName}`,
      ephemeral: true,
    });
  },
};