import { RecipleClient } from 'reciple';
import BaseModule from '../BaseModule.js';
import { Collection, Message, MessageReplyOptions } from 'discord.js';
import { PrismaClient } from '../../prisma/prisma-client/index.js';
import { setTimeout } from 'timers/promises';

export class Utility extends BaseModule {
    public client!: RecipleClient;
    public prisma: PrismaClient = new PrismaClient();

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.client = client;

        return true;
    }

    public async resolveFromCachedManager<V>(id: string, manager: { cache: Collection<string, V>; fetch(key: string): Promise<V|null> }): Promise<V> {
        const data = manager.cache.get(id) ?? await manager.fetch(id);
        if (data === null) throw new Error(`Couldn't fetch (${id}) from manager`);
        return data;
    }

    public async tempReply(message: Message, content: MessageReplyOptions|string, options?: { timer?: number, deleteReferenceMessage?: boolean }): Promise<void> {
        const reply = await message.reply(content).catch(() => null);

        await setTimeout(options?.timer || 5000);

        await reply?.delete().catch(() => {});
        if (options?.deleteReferenceMessage !== false) await message.delete().catch(() => {});
    }
}

export default new Utility();
