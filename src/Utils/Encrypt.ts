import { APIModalInteractionResponseCallbackData, ApplicationCommandType, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ContextMenuCommandBuilder, RecipleClient, SlashCommandBuilder } from 'reciple';
import BaseModule from '../BaseModule.js';
import { Encryption } from 'fallout-utility';

export class Encrypt extends BaseModule {
    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('encrypt')
                .setDescription('Encrypt a string with a password')
                .setExecute(async ({ interaction }) => {
                    await interaction.showModal(this.encryptModal());
                }),
            new ContextMenuCommandBuilder()
                .setName('Encrypt')
                .setType(ApplicationCommandType.Message)
                .setExecute(async ({ interaction }) => {
                    await interaction.showModal(this.encryptModal('EncryptWithoutText', interaction.targetId));
                }),
            new ContextMenuCommandBuilder()
                .setName('Decrypt')
                .setType(ApplicationCommandType.Message)
                .setExecute(async ({ interaction }) => {
                    await interaction.showModal(this.encryptModal('Decrypt', interaction.targetId));
                })
        ];

        this.interactionEvents = [
            {
                type: 'ModalSubmit',
                customId: id => id.startsWith('encrypt-modal'),
                execute: async interaction => {
                    await interaction.deferReply({ ephemeral: true });

                    const messageId: string|undefined = interaction.customId.split('-')[2];
                    const message = messageId ? interaction.channel?.messages.cache.get(messageId) ?? await interaction.channel?.messages.fetch(messageId).catch(() => null) : null;

                    if (messageId && !message?.content) {
                        await interaction.editReply('Unable to resolve message content to encrypt');
                        return;
                    }

                    const text = message?.content ?? interaction.fields.getTextInputValue('text');
                    const key = interaction.fields.getTextInputValue('key');

                    const encrypted = `${interaction.inGuild() ? interaction.user.toString() + ' **Sent an encrypted message**\n' : ''}${Encryption.encrypt(text, key)}`;

                    if (encrypted.length > 2000) {
                        await interaction.editReply('Your encrypted text exceeded Discord\'s message length limit')
                        return;
                    }

                    await interaction.channel?.send({
                        content: encrypted,
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    new ButtonBuilder()
                                        .setCustomId(`decrypt-button`)
                                        .setLabel('Decrypt')
                                        .setStyle(ButtonStyle.Secondary)
                                        .toJSON()
                                ]
                            }
                        ]
                    });

                    await interaction.editReply('Encrypted text sent!');
                }
            },
            {
                type: 'ModalSubmit',
                customId: id => id.startsWith('decrypt-modal-'),
                execute: async interaction => {
                    await interaction.deferReply({ ephemeral: true });

                    const messageId = interaction.customId.split('-')[2];
                    const message = interaction.channel?.messages.cache.get(messageId) ?? await interaction.channel?.messages.fetch(messageId).catch(() => null);

                    if (!message || !message.content) {
                        await interaction.editReply('Unable to resolve encrypted message');
                        return;
                    }

                    const encrypted = message.content.split('\n').pop()!;
                    const key = interaction.fields.getTextInputValue('key');

                    let decrypted: string|null = null;

                    try {
                        decrypted = Encryption.decrypt(encrypted, key);
                    } catch(err) {
                        await interaction.editReply('Unable to decrypt message');
                        return;
                    }

                    await interaction.editReply(decrypted);
                }
            },
            {
                type: 'Button',
                customId: 'decrypt-button',
                execute: async interaction => {
                    await interaction.showModal(this.encryptModal('Decrypt', interaction.message.id));
                }
            }
        ];

        return true;
    }


    public encryptModal(type?: undefined): APIModalInteractionResponseCallbackData;
    public encryptModal(type: 'Encrypt'): APIModalInteractionResponseCallbackData;
    public encryptModal(type: 'Decrypt'|'EncryptWithoutText', messageId: string): APIModalInteractionResponseCallbackData;
    public encryptModal(type: 'Decrypt'|'Encrypt'|'EncryptWithoutText' = 'Encrypt', messageId?: string): APIModalInteractionResponseCallbackData {
        const modal = new ModalBuilder({
            title: type === 'Decrypt' ? 'Decrypt Message' : 'Encrypt Message',
            custom_id: type === 'Decrypt' ? `decrypt-modal-${messageId}` : `encrypt-modal${type === 'EncryptWithoutText' ? ('-' + messageId) : ''}`
        });

        if (type === 'Encrypt') {
            modal.addComponents({
                type: ComponentType.ActionRow,
                components: [
                    new TextInputBuilder()
                        .setCustomId('text')
                        .setLabel('Context')
                        .setPlaceholder('Something secret you wanna hide')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph)
                        .toJSON()
                ]
            });
        }

        modal.addComponents({
            type: ComponentType.ActionRow,
            components: [
                new TextInputBuilder()
                    .setCustomId('key')
                    .setLabel('Secret Key')
                    .setPlaceholder('The secret key to decrypt this message')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .toJSON()
            ]
        });

        return modal.toJSON();
    }
}

export default new Encrypt();