import { RecipleClient, SlashCommandBuilder } from 'reciple';
import utility, { BaseModule } from '../utility';
import { ActionRowBuilder, ApplicationCommandType, Channel, ChannelManager, ContextMenuCommandBuilder, Message, MessageManager, ModalActionRowComponentBuilder, ModalBuilder, PermissionsBitField, TextInputBuilder, TextInputStyle, escapeMarkdown, inlineCode } from 'discord.js';

export class SendCommandModule extends BaseModule {
    get sendPermissions() {
        return new PermissionsBitField('ManageChannels');
    }

    public async onStart(client: RecipleClient<false>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('send')
                .setDescription('Send a message as a bot user')
                .setRequiredMemberPermissions(this.sendPermissions)
                .addStringOption(content => content
                    .setName('content')
                    .setDescription('Set message content')
                )
                .addStringOption(replyTo => replyTo
                    .setName('reply-to')
                    .setDescription('Set message as reply to a message using message Id')
                    .setAutocomplete(true)
                )
                .setExecute(async ({ interaction }) => {
                    const replyToId = interaction.options.getString('reply-to');
                    const content = interaction.options.getString('content');

                    if (!content) {
                        await interaction.showModal(this.createSendModal(interaction.channelId, replyToId || undefined))
                        return;
                    }

                    await interaction.deferReply({ ephemeral: true });
                    await interaction.channel?.sendTyping().catch(() => {});

                    const replyTo = replyToId ? await interaction.channel?.messages.fetch(replyToId).catch(() => undefined) : null;

                    if (replyTo === undefined) {
                        await interaction.editReply({
                            embeds: [
                                utility.createSmallEmbed(`Cannot find message id ${inlineCode(escapeMarkdown(replyTo || ''))}`, { userDescription: true, errorTheme: true })
                            ]
                        });

                        return;
                    }

                    if (replyTo) {
                        await replyTo.reply(content);
                    } else {
                        await interaction.channel?.send(content);
                    }

                    await interaction.editReply({
                        embeds: [
                            utility.createSmallEmbed(`Message has been sent`)
                        ]
                    });
                })
        ];

        client.commands.addAddtionalApplicationCommand(
            new ContextMenuCommandBuilder()
                .setName('Reply Message')
                .setDMPermission(false)
                .setType(ApplicationCommandType.Message)
                .setDefaultMemberPermissions(this.sendPermissions.bitfield)
        );

        this.interactionEvents = [
            {
                type: 'AutoComplete',
                commandName: 'send',
                handle: async interaction => {
                    if (!interaction.isAutocomplete() || !interaction.inCachedGuild()) return;

                    const query = interaction.options.getFocused();

                    let messages = (await interaction.channel?.messages.fetch({ limit: 25 }).catch(() => undefined))
                        ?.filter(msg => !query || msg.id === query || msg.author.id === query || msg.author.tag.toLowerCase().includes(query.toLowerCase()))
                        .sort((msg1, msg2) => msg2.createdTimestamp - msg1.createdTimestamp);

                    await interaction.respond(messages?.toJSON().slice(0, 25).map(msg => ({
                            name: `${msg.id} (by ${msg.author.tag})`,
                            value: msg.id
                        }))
                    ?? []).catch(() => {});
                }
            },
            {
                type: 'ContextMenu',
                commandName: 'Reply Message',
                handle: async interaction => {
                    if (!interaction.isMessageContextMenuCommand() || !interaction.inCachedGuild()) return;
                    await interaction.showModal(this.createSendModal(interaction.channelId, interaction.targetId));
                }
            },
            {
                type: 'ModalSubmit',
                customId: id => id.startsWith('send'),
                handle: async interaction => {
                    if (!interaction.isModalSubmit() || !interaction.inCachedGuild()) return;

                    const [command, channelId, replyToId] = interaction.customId.split('-');

                    await interaction.deferReply({ ephemeral: true });

                    const channel = await utility.resolveFromManagers<Channel, ChannelManager>(channelId, client.channels);
                    if (!channel?.isTextBased()) {
                        await interaction.editReply({
                            embeds: [
                                utility.createSmallEmbed(`Couldn't send message to channel`, { errorTheme: true })
                            ]
                        });
                        return;
                    }

                    const replyTo = replyToId ? await utility.resolveFromManagers<Message, MessageManager>(replyToId, channel.messages) : null;
                    const content = interaction.fields.getTextInputValue('content');

                    if (replyTo === undefined) {
                        await interaction.editReply({
                            embeds: [
                                utility.createSmallEmbed(`Couldn't find reply message`, { errorTheme: true })
                            ]
                        });
                        return;
                    }

                    await channel.sendTyping().catch(() => {});

                    if (replyTo) {
                        await replyTo.reply(content);
                    } else {
                        await channel.send(content);
                    }

                    await interaction.editReply({
                        embeds: [
                            utility.createSmallEmbed('Message has been sent')
                        ]
                    });
                }
            }
        ];

        return true;
    }

    public createSendModal(channelId: string, replyTo?: string): ModalBuilder {
        return new ModalBuilder()
            .setTitle(replyTo ? `Reply content` : `New message content`)
            .setCustomId(`send$-${channelId}${replyTo ? '-' + replyTo : ''}`)
            .setComponents(
                new ActionRowBuilder<ModalActionRowComponentBuilder>()
                    .setComponents(
                        new TextInputBuilder()
                            .setLabel('Message content')
                            .setCustomId('content')
                            .setPlaceholder('Hello!')
                            .setMaxLength(2000)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
            )
    }
}

export default new SendCommandModule();