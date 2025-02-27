import { Listener } from 'discord-akairo';
import { TOPICS } from '../../util/logger';

export default class ShardReconnectListener extends Listener {
	public constructor() {
		super('shardReconnecting', {
			emitter: 'client',
			event: 'shardReconnecting',
			category: 'client'
		});
	}

	public exec(id: number): void {
		this.client.logger.info(`Come at me if you don't value your life!`, { topic: TOPICS.DISCORD, event: `SHARD ${id} RECONNECTING` });
		this.client.promServer.close();
		this.client.node.removeListener('message', this.client.nodeMessage);
		this.client.logger.info(`Metrics server closed.`, { topic: TOPICS.METRICS, event: `SHARD ${id} RECONNECTING` });
	}
}
