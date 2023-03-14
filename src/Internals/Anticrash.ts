import { RecipleClient, RecipleModuleScriptUnloadData } from 'reciple';
import BaseModule from '../BaseModule.js';
import { AttachmentBuilder, BaseMessageOptions, ChannelType, EmbedBuilder, Message, TextBasedChannel, codeBlock } from 'discord.js';
import { Logger, limitString } from 'fallout-utility';
import Config from '../Config.js';
import Utility from './Utility.js';
import { inspect } from 'util';

export interface AnticrashConfig {
    reportChannels: string[];
}

export class Anticrash extends BaseModule {
    public client!: RecipleClient;
    public logger?: Logger;

    get config() { return Config.config.anticrash; }

    constructor() {
        super();

        this._reportListener = this._reportListener.bind(this);
    }

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.client = client;
        this.logger = client.logger?.clone({ name: 'Anticrash' });

        return true;
    }

    public async onLoad(client: RecipleClient<boolean>): Promise<void> {
        client.on('error', this._reportListener);
        client.on('shardError', this._reportListener);
        client.on('recipleError', this._reportListener);

        process.on('uncaughtException', this._reportListener);
        process.on('unhandledRejection', this._reportListener);

        this.logger?.warn('Listening to client and process error events!');
    }

    public async onUnload(data: RecipleModuleScriptUnloadData): Promise<void> {
        this.client.removeListener('error', this._reportListener);
        this.client.removeListener('shardError', this._reportListener);
        this.client.removeListener('recipleError', this._reportListener);

        process.removeListener('uncaughtException', this._reportListener);
        process.removeListener('unhandledRejection', this._reportListener);

        this.logger?.warn(`Unmounted client and process error listeners!`);
    }

    public async getReportChannels(): Promise<TextBasedChannel[]> {
        const channels: TextBasedChannel[] = [];

        for (const channelId of this.config.reportChannels) {
            const channel = await Utility.resolveFromCachedManager(channelId, this.client.channels).catch(() => null);
            if (!channel) {
                this.logger?.error(`Unable to resolve report channel: ${channelId}`);
                continue;
            }

            if (!channel.isTextBased()) {
                this.logger?.error(`Channel (${channelId}) is not a text channel`);
                continue;
            }

            channels.push(channel);
        }

        return channels;
    }

    public createReportMessageData(report: any): BaseMessageOptions {
        const data = inspect(report);

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Anticrash report' })
            .setDescription(codeBlock(limitString(data, 3700)))
            .setColor(Config.config.embedColor)
            .setTimestamp();

        const reportFile = data.length >= 2000
            ? new AttachmentBuilder(Buffer.from(data), { name: 'report.txt' })
            : null;

        return {
            embeds: [embed],
            files: reportFile ? [reportFile] : []
        };
    }

    public async report(report: any): Promise<Message[]> {
        const reportData: BaseMessageOptions = this.createReportMessageData(report);
        const reportMessages: Message[] = [];

        for (const channel of (await this.getReportChannels())) {
            const message = await channel.send(reportData).catch(() => null);
            if (!message) {
                this.logger?.error(`Unable to send Anticrash report to channel: ${channel.id}`);
                continue
            }

            reportMessages.push(message);
        }

        return reportMessages;
    }

    private async _reportListener(report: any): Promise<void> {
        await this.report(report);
    }
};

export default new Anticrash();