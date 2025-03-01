import { Message, MessageEmbed, GuildMember, User } from 'discord.js';
import { stripIndents, oneLine } from 'common-tags';
import { Repository } from 'typeorm';
import { Case } from '../models/Cases';
const ms = require('@naval-base/ms'); // eslint-disable-line

interface Actions {
	[key: number]: string;
}

const ACTIONS: Actions = {
	1: 'ban',
	2: 'unban',
	3: 'kick',
	4: 'kick',
	5: 'mute',
	6: 'restriction',
	7: 'restriction',
	8: 'restriction',
	9: 'warn',
	10: 'restriction'
};

export default {
	CONSTANTS: {
		ACTIONS: {
			BAN: 1,
			UNBAN: 2,
			SOFTBAN: 3,
			KICK: 4,
			MUTE: 5,
			EMBED: 6,
			EMOJI: 7,
			REACTION: 8,
			WARN: 9,
			TAG: 10
		} as { [key: string]: number },
		COLORS: {
			BAN: 16718080,
			UNBAN: 8450847,
			SOFTBAN: 16745216,
			KICK: 16745216,
			MUTE: 16763904,
			EMBED: 16776960,
			EMOJI: 16776960,
			REACTION: 16776960,
			WARN: 16776960,
			TAG: 16776960
		} as { [key: string]: number }
	},
	reminderEmbed: (message: Message, reminders: any): MessageEmbed => {
		const truncate = (str: string, len: number): string => str.length > len ? `${str.slice(0, len)}…` : str;
		return new MessageEmbed()
			.setAuthor(`${message.author!.tag} (${message.author!.id})`, message.author!.displayAvatarURL())
			.setColor(0x30A9ED)
			.setThumbnail(message.author!.displayAvatarURL())
			.setDescription(reminders.length
				? reminders.sort((a: { triggers_at: number }, b: { triggers_at: number }): number => a.triggers_at - b.triggers_at).map(
					(reminder: any, i: number): string => `${i + 1}. ${truncate(reminder.reason || 'reasonless', 30)} \`${reminder.triggers_at.toUTCString()}\`${reminder.channel ? '' : ' (DM)'}`
				).join('\n')
				: 'No reminders');
	},
	logEmbed: async ({ message = null, db = null, channel, member, action, duration = null, caseNum, reason, ref = null }: { message?: Message | null; db?: Repository<Case> | null; channel?: string; member: GuildMember | User; action: string; duration?: number | null; caseNum: number; reason: string; ref?: number | null }): Promise<MessageEmbed> => {
		const embed = new MessageEmbed();
		if (message) {
			embed.setAuthor(`${message.author!.tag} (${message.author!.id})`, message.author!.displayAvatarURL());
		}
		let reference;
		if (message && db && ref) {
			try {
				reference = await db.findOne({ guild: message.guild!.id, case_id: ref });
			} catch {
				reference = null;
			}
		}
		embed.setDescription(stripIndents`
				**Member:** ${member instanceof User ? member.tag : member.user.tag} (${member.id})
				**Action:** ${action}${action === 'Mute' && duration ? `\n**Length:** ${ms(duration, { 'long': true })}` : ''}
				**Reason:** ${reason}${reference ? `\n**Ref case:** [${reference.case_id}](https://discordapp.com/channels/${reference.guild}/${channel}/${reference.message})` : ''}
			`)
			.setThumbnail(member instanceof User ? member.displayAvatarURL() : member.user.displayAvatarURL())
			.setFooter(`Case ${caseNum}`)
			.setTimestamp(new Date());

		return embed;
	},
	historyEmbed: (member: GuildMember, cases: any): MessageEmbed => {
		const footer = cases.reduce((count: any, c: any): string => {
			const action = ACTIONS[c.action];
			count[action] = (count[action] || 0) as number + 1;
			return count;
		}, {});
		const colors = [8450847, 10870283, 13091073, 14917123, 16152591, 16667430, 16462404];
		const values = [footer.warn || 0, footer.restriction || 0, footer.mute || 0, footer.kick || 0, footer.ban || 0];
		const [warn, restriction, mute, kick, ban] = values;
		const colorIndex = Math.min(values.reduce((a: number, b: number): number => a + b), colors.length - 1);

		return new MessageEmbed()
			.setAuthor(`${member.user.tag} (${member.id})`, member.user.displayAvatarURL())
			.setColor(colors[colorIndex])
			.setThumbnail(member.user.displayAvatarURL())
			.setFooter(oneLine`${warn} warning${warn > 1 || warn === 0 ? 's' : ''},
				${restriction} restriction${restriction > 1 || restriction === 0 ? 's' : ''},
				${mute} mute${mute > 1 || mute === 0 ? 's' : ''},
				${kick} kick${kick > 1 || kick === 0 ? 's' : ''},
				and ${ban} ban${ban > 1 || ban === 0 ? 's' : ''}.
			`);
	}
};
