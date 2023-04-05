import { DiscordScamLinks } from '@falloutstudios/djs-scam-links';
import { BanOptions, BaseMessageOptions, Message, PartialMessage, TextBasedChannel, inlineCode } from 'discord.js';
import BaseModule from '../BaseModule.js';
import { RecipleClient, RecipleModuleScriptUnloadData } from 'reciple';
import Config from '../Config.js';
import Utility from '../Internals/Utility.js';

export interface AntiScamLinksConfig {
    reportChannel: {
        channelId?: string|null;
        messageData: BaseMessageOptions;
    };
    messageReply: {
        enabled: boolean;
        messageData: BaseMessageOptions;
        deleteAfterMs?: number|null;
    };
    punishment?: BanOptions & {
        type: 'Ban';
        reason?: string|null;
    }|
    {
        type: 'Kick';
        reason?: string|null;
    }|
    {
        type: 'Timeout';
        durationMs: number;
        reason?: string|null;
    }|
    null;
}

export class AntiScamLinks extends BaseModule {
    public linksManager: DiscordScamLinks = new DiscordScamLinks();
    public client!: RecipleClient;

    get config() { return Config.config.antiScamLinks; }

    constructor() {
        super();

        this.checkMessage = this.checkMessage.bind(this);
        this.checkUpdatedMessage = this.checkUpdatedMessage.bind(this);
    }

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.client = client;

        return true;
    }

    public async onLoad(client: RecipleClient<boolean>): Promise<void> {
        client.on('messageCreate', this.checkMessage);
        client.on('messageUpdate', this.checkUpdatedMessage);
    }

    public async onUnload(data: RecipleModuleScriptUnloadData): Promise<void> {
        this.client.removeListener('messageCreate', this.checkMessage);
        this.client.removeListener('messageUpdate', this.checkUpdatedMessage);
    }

    public async checkMessage(message: Message): Promise<void> {
        if (message.author.id === this.client.user?.id) return;
        if (!message.inGuild()) return;

        const matchedScamLinks = this.linksManager.getMatches(message.content);
        if (!matchedScamLinks.length) return;

        const placeholders = {
            'scamlinks': matchedScamLinks.map(s => inlineCode(s)).join('\n')
        };

        if (this.config.punishment) {
            switch (this.config.punishment.type) {
                case 'Ban':
                    if (message.member?.bannable) await message.member?.ban(this.config.punishment).catch(() => null);
                    break;
                case 'Kick':
                    if (message.member?.kickable) await message.member?.kick(this.config.punishment.reason || undefined).catch(() => null);
                    break;
                case 'Timeout':
                    if (message.member?.moderatable) await message.member?.timeout(this.config.punishment.durationMs, this.config.punishment.reason || undefined).catch(() => null);
                    break;
            }
        }

        if (this.config.messageReply.enabled) {
            const replyMessage = Utility.replaceMessagePlaceholders(this.config.messageReply.messageData, message, { additionalPlaceholders: placeholders });
            const reply = await message.channel.send(replyMessage);

            if (this.config.messageReply.deleteAfterMs) {
                setTimeout(() => reply.delete().catch(() => null), this.config.messageReply.deleteAfterMs);
            }
        }

        if (this.config.reportChannel.channelId) {
            let reportChannel = this.config.reportChannel.channelId
                                ? await Utility.resolveFromCachedManager(this.config.reportChannel.channelId, this.client.channels) as TextBasedChannel
                                : null;
            reportChannel = !reportChannel || !reportChannel?.isTextBased() ? reportChannel : null;

            const reportMessage = Utility.replaceMessagePlaceholders(this.config.reportChannel.messageData, message, { additionalPlaceholders: placeholders });

            if (reportChannel) await reportChannel.send(reportMessage).catch(() => null);
        }
    }

    public async checkUpdatedMessage(oldMessage: PartialMessage, newMessage: Message): Promise<void> {
        return this.checkMessage(newMessage);
    }
}