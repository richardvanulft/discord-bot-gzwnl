const { unTimeoutTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "untimeout",
  description: "remove timeout from a member",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    aliases: ["unmute"],
    usage: "<ID|@member> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "the target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "reason for timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = args.slice(1).join(" ").trim();
    const response = await untimeout(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const moderatorRoleID = process.env.MODERATOR_ROLE_ID;

    if (!interaction.member.roles.cache.has(moderatorRoleID)) {
      return interaction.reply('You do not have permission to use this command.');
    }
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await untimeout(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function untimeout(issuer, target, reason) {
  const response = await unTimeoutTarget(issuer, target, reason);
  if (typeof response === "boolean") {
    // Send DM to the user
    await target.user.send(`Hey ${target.user.username}, ${issuer.user.username} has removed your timeout from ${issuer.guild.name}! Try to do better so you don't get timed out again. :)`);
    return `Timeout of ${target.user.username} is removed!`;
  }
  if (response === "BOT_PERM") return `I do not have permission to remove timeout of ${target.user.username}`;
  else if (response === "MEMBER_PERM") return `You do not have permission to remove timeout of ${target.user.username}`;
  else if (response === "NO_TIMEOUT") return `${target.user.username} is not timed out!`;
  else return `Failed to remove timeout of ${target.user.username}`;
}