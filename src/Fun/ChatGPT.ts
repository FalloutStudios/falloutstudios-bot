import { CommandCooldownData, CommandType, RecipleClient, RecipleModuleScriptUnloadData, SlashCommandBuilder } from 'reciple';
import BaseModule from '../BaseModule.js';
import Config from '../Config.js';
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from 'openai';
import { Message } from 'discord.js';
import Utility from '../Internals/Utility.js';
import { limitString } from 'fallout-utility';
import Anticrash from '../Internals/Anticrash.js';

export interface ChatGPTConfig {
    context: string;
    aiModel: string;
    enableChatChannels: boolean;
    enableAskCommand: boolean;
    dmAskCommand: boolean;
    queryLimit: number;
    askCooldown: number;
    apiTimeout: number|null;
}

export class ChatGPT extends BaseModule {
    public openAI!: OpenAIApi;

    get config() { return Config.config.chatgpt; }

    constructor() {
        super();

        this._onMessageCreate = this._onMessageCreate.bind(this);
    }

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        const openAIConfig = new Configuration({
            organization: process.env.OPENAI_ORGANIZATION,
            apiKey: process.env.OPENAI_API_KEY
        });

        this.openAI = new OpenAIApi(openAIConfig);

        if (this.config.enableAskCommand) {
            this.commands = [
                new SlashCommandBuilder()
                    .setName('ask')
                    .setDescription('Ask an AI with your questions')
                    .setCooldown(this.config.askCooldown)
                    .setDMPermission(this.config.dmAskCommand)
                    .addStringOption(query => query
                        .setName('query')
                        .setDescription('Query to ask')
                        .setRequired(true)
                    )
                    .setExecute(async ({ interaction }) => {
                        if (!interaction.inCachedGuild() && !this.config.dmAskCommand) return;

                        await interaction.deferReply();

                        const query = interaction.options.getString('query', true);
                        const reply = await this.ask(query, { author: interaction.user.username.replace(/[^A-Za-z0-9_-]/g, '') });

                        await interaction.editReply(reply);
                    })
            ];
        }

        return true;
    }

    public async onLoad(client: RecipleClient<boolean>): Promise<void> {
        client.on('messageCreate', this._onMessageCreate);
    }

    public async onUnload(data: RecipleModuleScriptUnloadData): Promise<void> {
        data.client.removeListener('messageCreate', this._onMessageCreate);
    }

    public async ask(query: string, options?: { conversationData?: (string|ChatCompletionRequestMessage)[]; author?: string; }): Promise<string> {
        if (query.length > this.config.queryLimit) return 'That\'s alot! I\'m not going to read all of that.';

        const response = await this.openAI.createChatCompletion({
            model: this.config.aiModel,
            max_tokens: 2000,
            user: options?.author,
            messages: [
                {
                    role: 'system',
                    content: this.config.context
                },
                ...(options?.conversationData || []).map(content => (
                    typeof content === 'string'
                        ? { role: 'user' as 'user', content }
                        : content
                )),
                {
                    role: 'user',
                    name: options?.author,
                    content: query
                }
            ],
            n: 1,
        }, { timeout: this.config.apiTimeout || undefined }).catch(async err => {
            await Anticrash.report(err.response);
            return null;
        });

        const message = response?.data.choices.find(r => r.message?.content);
        if (!message || !message.message?.content) return 'I cannot think of a response to that at this moment.';

        return limitString(message.message.content, 1997, message.finish_reason !== 'length' ? '...' : '') + (message.finish_reason === 'length' ? '...' : '');
    }

    private async _onMessageCreate(message: Message): Promise<void> {
        if (!message.inGuild() || message.author.bot || !this.config.enableChatChannels) return;

        if (this.config.askCooldown) {
            const cooldownData: Omit<CommandCooldownData, 'endsAt'> = {
                command: 'ask',
                type: CommandType.SlashCommand,
                user: message.author
            };

            if (!Utility.client.cooldowns.isCooledDown(cooldownData)) {
                Utility.client.cooldowns.add({
                    ...cooldownData,
                    endsAt: new Date(Date.now() + this.config.askCooldown)
                });
            } else {
                await Utility.tempReply(message, 'Hey! don\'t ask too fast');
                return;
            }
        }

        const guildChatGPTSettings = await Utility.prisma.chatGPTSettings.findFirst({ where: { id: message.guild.id } });
        if (!guildChatGPTSettings || guildChatGPTSettings.channelId !== message.channel.id) return;

        await message.channel.sendTyping();

        const author = message.author.username.replace(/[^A-Za-z0-9_-]/g, '');
        const conversations = (await message.channel.messages.fetch({ before: message.id, limit: 20 }).catch(() => null))
            ?.filter(m => m.content.length <= this.config.queryLimit && m.content)
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .map(m => ({
                role: (m.author.id === m.client.user.id ? 'assistant' : 'user') as 'user'|'assistant',
                name: m.author.username.replace(/[^A-Za-z0-9_-]/g, ''),
                content: m.content
            }));

        const reply = await this.ask(message.content, { conversationData: conversations, author });
        await message.reply({
            content: reply,
            allowedMentions: {
                repliedUser: false
            }
        }).catch(err => Anticrash.report(err));
    }
}

export default new ChatGPT();