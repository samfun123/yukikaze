import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { TOPICS, EVENTS } from '../../util/logger';

export default class CommandBlockedListener extends Listener {
	public constructor() {
		super('commandBlocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked',
			category: 'commandHandler'
		});
	}

	public exec(message: Message, command: Command, reason: string): void {
		this.client.logger.info(`Blocked ${command.id} on ${message.guild ? `${message.guild.name} (${message.guild.id})` : 'DM'} with reason ${reason}`, { topic: TOPICS.DISCORD_AKAIRO, event: EVENTS.COMMAND_BLOCKED });
	}
}
