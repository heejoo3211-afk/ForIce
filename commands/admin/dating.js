const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getGuildSettings,
  updateGuildSettings,
} = require("../../utils/database");

const {
  isBotAdmin,
} = require("../../utils/permissions");

const {
  getOutputChannel,
  formatNumber,
} = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("콜팅")
  .setDescription("콜팅 상태를 관리합니다.")
  .addStringOption((option) =>
    option
      .setName("작업")
      .setDescription("실행할 작업을 선택하세요.")
      .setRequired(true)
      .addChoices(
        {
          name: "시작",
          value: "시작",
        },
        {
          name: "종료",
          value: "종료",
        },
        {
          name: "재시작",
          value: "재시작",
        }
      )
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

    const channel = await getOutputChannel(interaction);

    /*
     * 콜팅 시작
     */
    if ( action === "시작") {
      updateGuildSettings(
        interaction.guildId,
        (settings) => {
          settings.datingEnabled = true;

          // 이전 콜팅 구매 기록 초기화
          settings.purchaseHistory = [];

          return settings;
        }
      );

      await channel.send({
        content: `# ㅤ     <:6_hongdae_aSG_H2011:1495109880426532904> 𝐂𝐚𝐥𝐥 & 𝐓𝐢𝐧𝐠 <:6_hongdae_aSG_H2012:1495109877276737818>
-# ㅤ          ㅤ     역대급 콜팅 진행합니다 .ᐟ 

ㅤ 𓈒⠀⠀⠀︵︵︵⠀◟ <:6_hongdae_aSG_H2020:1495112525132337403> ◞⠀︵︵︵⠀⠀⠀𓈒

ㅤㅤㅤㅤ**마음에 들면 콜 !**
ㅤㅤㅤㅤ**마음에 들지 않으면 팅 !**

## ㅤ      <:6_hongdae_aSG_H2018:1495111777602633769> 콜 팅 규 칙 <:6_hongdae_aSG_H2018:1495111777602633769>

> 참여 확인 후 진행자가 마이크 권한을 드립니다
-# ⤷ 도배 , 욕설 등 재촉시에 경고 지급

> 마이크 권한을 얻고 난 뒤에 자신을 어필하기
-# ⤷ 매력어필 , 플러팅 등등 자유롭게 이야기해 주세요 !

> 마이크 권한을 가지신 분은 쩜대기 & 지목 택하기
-# ⤷ 쩜대기를 택할시에 채팅방에서 " . " 을 적어주세요 !

> " . "을 작성하신 분들 중 한분과 1 : 1 대화 진행
-# ⤷ 대화를 진행하고 콜 & 팅 고르기

ㅤ 𓈒⠀⠀⠀︵︵︵⠀◟ <:6_hongdae_aSG_H2020:1495112525132337403> ◞⠀︵[︵](https://cdn.discordapp.com/attachments/1504784795123712022/1504869565270855801/GIF.gif?ex=6a088e7f&is=6a073cff&hm=cba85cd2e771fa0ec0764f8f3b1aefd368ded6eeebd0610e026aff2f34fc13dc&)︵⠀⠀⠀𓈒

-# 콜팅 관련 모든 문의 고위직에게 문의 주세요 !
|| @everyone , <@&1493615810084868176> ||`,
        allowedMentions: {
          parse: ["everyone", "roles"],
        },
      });

      return interaction.reply({
        content:
          "콜팅을 시작했습니다.\n이전 후원 기록은 초기화되었습니다.",
        ephemeral: true,
      });
    }

    /*
     * 콜팅 재시작
     */
    if ( action === "재시작") {
      updateGuildSettings(
        interaction.guildId,
        (settings) => {
          settings.datingEnabled = true;
          settings.purchaseHistory = [];

          return settings;
        }
      );

      await channel.send({
        content:
          "# 콜팅이 재시작되었습니다.\n" +
          "이전 후원 기록은 초기화되었습니다.",
      });

      return interaction.reply({
        content: "콜팅을 재시작했습니다.",
        ephemeral: true,
      });
    }

    /*
     * 콜팅 종료
     */
    if (action === "종료") {
      const settings = getGuildSettings(
        interaction.guildId
      );

      const purchaseHistory = Array.isArray(
        settings.purchaseHistory
      )
        ? settings.purchaseHistory
        : [];

      updateGuildSettings(
        interaction.guildId,
        (guildSettings) => {
          guildSettings.datingEnabled = false;
          return guildSettings;
        }
      );

      if (purchaseHistory.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(0xf45aa5)
          .setTitle("- 콜 팅 종 료 -")
          .setDescription(
            "콜팅이 종료되었습니다.\n\n" +
              "이번 콜팅의 후원 기록이 없습니다."
          )
          .setFooter({
            text: interaction.guild.name,
            iconURL:
              interaction.guild.iconURL({
                size: 128,
              }) || undefined,
          })
          .setTimestamp();

        await channel.send({
          embeds: [emptyEmbed],
        });

        return interaction.reply({
          content: "콜팅을 종료했습니다.",
          ephemeral: true,
        });
      }

      /*
       * 임베드 한 개에 너무 많은 기록이 들어가지 않도록
       * 15개씩 나누어서 출력
       */
      const recordsPerPage = 15;
      const totalPages = Math.ceil(
        purchaseHistory.length / recordsPerPage
      );

      for (
        let pageIndex = 0;
        pageIndex < totalPages;
        pageIndex++
      ) {
        const startIndex =
          pageIndex * recordsPerPage;

        const pageRecords = purchaseHistory.slice(
          startIndex,
          startIndex + recordsPerPage
        );

        const description = pageRecords
          .map((purchase, index) => {
            const order =
              startIndex + index + 1;

            return (
  `### ${order}. <@${purchase.userId}>\n` +
  `> 충전 포인트: **${formatNumber(
    purchase.amount
  )} P**`
);
})
.join("\n\n");

const totalPoints = purchaseHistory.reduce(
  (sum, purchase) =>
    sum + Number(purchase.amount || 0),
  0
);
        const resultEmbed = new EmbedBuilder()
          .setColor(0xf45aa5)
          .setTitle("- 콜 팅 후 원 순 서 -")
          .setDescription(description)
          .addFields({
            name: "콜팅 후원 정보",
            value:
              `총 후원 횟수: **${purchaseHistory.length}회**\n` +
              `총 사용 포인트: **${formatNumber(
                totalPoints
              )} P**`,
            inline: false,
          })
          .setFooter({
            text:
              totalPages > 1
                ? `${interaction.guild.name} · ${pageIndex + 1}/${totalPages}`
                : interaction.guild.name,
            iconURL:
              interaction.guild.iconURL({
                size: 128,
              }) || undefined,
          })
          .setTimestamp();

        await channel.send({
          embeds: [resultEmbed],

          // 유저 멘션 모양만 표시하고 실제 알림은 보내지 않음
          allowedMentions: {
            parse: [],
          },
        });
      }

      return interaction.reply({
        content:
          `콜팅을 종료했습니다.\n` +
          `후원 기록 ${purchaseHistory.length}개를 표시했습니다.`,
        ephemeral: true,
      });
    }
  },
};