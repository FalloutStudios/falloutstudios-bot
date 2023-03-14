import { RecipleClient, cwd } from 'reciple';
import BaseModule from './BaseModule.js';
import { AnticrashConfig } from './Internals/Anticrash.js';
import { createReadFile } from 'fallout-utility';
import path from 'path';
import yml from 'yaml';
import { writeFileSync } from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import { PartialDeep } from 'type-fest';
import { ColorResolvable } from 'discord.js';
import { ChatGPTConfig } from './Fun/ChatGPT.js';

export interface BotConfig {
    embedColor: ColorResolvable;
    errorColor: ColorResolvable;

    anticrash: AnticrashConfig;
    chatgpt: ChatGPTConfig;
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
        chatgpt: {
            context: 'You are a cool chatbot in discord',
            aiModel: 'gpt-3.5-turbo',
            askCooldown: 10000,
            enableAskCommand: true,
            enableChatChannels: true,
            dmAskCommand: true,
            queryLimit: 2000
        }
    };
}

export default new Config();