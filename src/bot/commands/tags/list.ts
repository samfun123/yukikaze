import { Command } from 'discord-akairo';
import { Message, MessageEmbed, GuildMember } from 'discord.js';
import { Tag } from '../../models/Tags';

export default class TagListCommand extends Command {
	public constructor() {
		super('tag-list', {
			aliases: ['tags'],
			category: 'tags',
			description: {
				content: 'Lists all server tags.'
			},
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS'],
			ratelimit: 2,
			args: [
				{
					id: 'member',
					type: 'member'
				}
			]
		});
	}

	// @ts-ignore
	public userPermissions(message: Message): string | null {
		const restrictedRoles = this.client.settings.get(message.guild!, 'restrictedRoles', undefined);
		if (!restrictedRoles) return null;
		const hasRestrictedRole = message.member!.roles.has(restrictedRoles.tag);
		if (hasRestrictedRole) return 'Restricted';
		return null;
	}

	public async exec(message: Message, { member }: { member: GuildMember }): Promise<Message | Message[]> {
		const tagsRepo = this.client.db.getRepository(Tag);
		if (member) {
			const tags = await tagsRepo.find({ user: member.id, guild: message.guild!.id });
			if (!tags.length) {
				if (member.id === message.author!.id) return message.util!.reply("you don't have any tags.");
				return message.util!.reply(`**${member.displayName}** doesn't have any tags.`);
			}
			const embed = new MessageEmbed()
				.setColor(0x30a9ed)
				.setAuthor(`${member.user.tag} (${member.id})`, member.user.displayAvatarURL())
				.setDescription(
					tags
						.map((tag): string => `\`${tag.name}\``)
						.sort()
						.join(', ')
				);

			return message.util!.send(embed);
		}
		const tags = await tagsRepo.find({ guild: message.guild!.id });
		if (!tags.length) return message.util!.send(`**${message.guild!.name}** doesn't have any tags. Why not add some?`);
		const hoistedTags = tags
			.filter((tag): boolean => tag.hoisted)
			.map((tag): string => `\`${tag.name}\``)
			.sort()
			.join(', ');
		const userTags = tags
			.filter((tag): boolean => !tag.hoisted)
			.filter((tag): boolean => tag.user === message.author!.id)
			.map((tag): string => `\`${tag.name}\``)
			.sort()
			.join(', ');
		const embed = new MessageEmbed()
			.setColor(0x30a9ed)
			.setAuthor(`${message.author!.tag} (${message.author!.id})`, message.author!.displayAvatarURL());
		if (hoistedTags) embed.addField('❯ Tags', hoistedTags);
		if (userTags) embed.addField(`❯ ${message.member!.displayName}'s tags`, userTags);

		return message.util!.send(embed);
	}
}
