import { Channel, Collection, Guild, Message, MessageReplyOptions, User } from 'discord.js';
import { PrismaClient } from '../../prisma/prisma-client/index.js';
import { recursiveObjectReplaceValues } from 'fallout-utility';
import { setTimeout } from 'timers/promises';
import BaseModule from '../BaseModule.js';
import { RecipleClient } from 'reciple';

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

    public replacePlaceholders<T extends string|object>(data: T, placeholders: Record<string, string>): T {
        return recursiveObjectReplaceValues(data, Object.keys(placeholders).map(s => !(s.startsWith('{') && s.endsWith('}')) ? `{${s}}` : s), Object.values(placeholders));
    }

    public replaceUserPlaceholders<T extends string|object>(data: T, user: User, options?: { additionalPlaceholders?: Record<string, string>; prefix?: string; }): T {
        const prefix = options?.prefix || 'user';

        return this.replacePlaceholders(data, {
            ...options?.additionalPlaceholders,
            [`${prefix}_id`]: user.id,
            [`${prefix}_username`]: user.username,
            [`${prefix}_discriminator`]: user.discriminator,
            [`${prefix}_avatar`]: user.displayAvatarURL(),
            [`${prefix}_mention`]: user.toString()
        });
    }

    public replaceChannelPlaceholders<T extends string|object>(data: T, channel: Channel, options?: { additionalPlaceholders?: Record<string, string>; prefix?: string; }): T {
        const prefix = options?.prefix || 'channel';
        const placeholders = {
            ...options?.additionalPlaceholders,
            [`${prefix}_id`]: channel.id,
            [`${prefix}_name`]: !channel.isDMBased() ? channel.name : '',
            [`${prefix}_mention`]: !channel.isDMBased() ? channel.toString() : ''
        };

        return channel.isDMBased()
            ? this.replacePlaceholders(data, placeholders)
            : this.replaceGuildPlaceholders(data, channel.guild, {
                prefix: `${prefix}_guild`,
                additionalPlaceholders: placeholders
            });
    }

    public replaceGuildPlaceholders<T extends string|object>(data: T, guild: Guild, options?: { additionalPlaceholders?: Record<string, string>; prefix?: string; }): T {
        const prefix = options?.prefix || 'guild';

        return this.replacePlaceholders(data, {
            ...options?.additionalPlaceholders,
            [`${prefix}_id`]: guild.id,
            [`${prefix}_name`]: guild.name,
            [`${prefix}_icon`]: guild.iconURL() || '',
            [`${prefix}_owner_id`]: guild.ownerId
        });
    }

    public replaceMessagePlaceholders<T extends string|object>(data: T, message: Message, options?: { additionalPlaceholders?: Record<string, string>; prefix?: string; }): T {
        const prefix = options?.prefix || 'message';

        data = this.replaceUserPlaceholders(data, message.author, {
            prefix: `${prefix}_author`,
            additionalPlaceholders: {
                ...options?.additionalPlaceholders,
                [`${prefix}_id`]: message.id,
                [`${prefix}_content`]: message.content,
                [`${prefix}_embeds_size`]: String(message.embeds.length)
            }
        });

        if (message.channel) data = this.replaceChannelPlaceholders(data, message.channel, { prefix: `${prefix}_channel` });
        if (message.guild) data = this.replaceGuildPlaceholders(data, message.guild, { prefix: `${prefix}_guild` });

        return data;
    }
}

export default new Utility();
