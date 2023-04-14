import { RecipleClient, cwd } from 'reciple';
import BaseModule from './BaseModule.js';
import { AnticrashConfig } from './Internals/Anticrash.js';
import { createReadFile, PartialDeep } from 'fallout-utility';
import path from 'path';
import yml from 'yaml';
import { writeFileSync } from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import { ColorResolvable, resolveColor } from 'discord.js';
import { AntiScamLinksConfig } from './Utils/AntiScamLinks.js';

export interface BotConfig {
    embedColor: ColorResolvable;
    errorColor: ColorResolvable;

    anticrash: AnticrashConfig;
    antiScamLinks: AntiScamLinksConfig;
}

export class Config extends BaseModule {
    public config: BotConfig = Config.default;
    public configFile: string = path.join(cwd, './config/config.yml');

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.config = await this.getConfig();
        return true;
    }

    public async getConfig(): Promise<BotConfig> {
        return createReadFile(this.configFile, Config.default, {
            encodeFileData: data => yml.stringify(data),
            formatReadData: data => {
                const parsed = defaultsDeep(yml.parse(data.toString('utf-8')), Config.default);

                writeFileSync(this.configFile, yml.stringify(parsed));
                return parsed;
            },
            encoding: 'utf-8'
        });
    }

    public async saveConfig(data?: PartialDeep<BotConfig>): Promise<BotConfig> {
        this.config = defaultsDeep(data || {}, this.config, Config.default);

        writeFileSync(this.configFile, yml.stringify(this.config));
        return this.config;
    }

    static readonly default: BotConfig = {
        embedColor: 'Blue',
        errorColor: 'DarkButNotBlack',
        anticrash: {
            reportChannels: []
        },
        antiScamLinks: {
            reportChannel: {
                channelId: null,
                messageData: {
                    embeds: [
                        {
                            title: 'Anti scam links',
                            description: '{message_content}',
                            color: resolveColor('Red'),
                            fields: [
                                {
                                    name: 'Author',
                                    value: '{message_author_mention} `{message_author_id}`',
                                    inline: true
                                },
                                {
                                    name: 'Matched Links',
                                    value: '{scamlinks}',
                                    inline: true
                                }
                            ]
                        }
                    ]
                }
            },
            messageReply: {
                enabled: true,
                messageData: {
                    content: '{message_author_mention} You message contains flagged scam links.'
                },
                deleteAfterMs: 10000
            },
            punishment: {
                type: 'Timeout',
                durationMs: 60000,
                reason: 'Sending scam links'
            }
        }
    };
}

export default new Config();