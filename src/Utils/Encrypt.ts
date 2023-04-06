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
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    await interaction.showModal(this.encryptModal());
                }),
            new ContextMenuCommandBuilder()
                .setName('Decrypt')
                .setType(ApplicationCommandType.Message)
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    await interaction.showModal(this.encryptModal(true, interaction.targetId));
                })
        ];

        this.interactionEvents = [
            {
                type: 'ModalSubmit',
                customId: 'encrypt-modal',
                execute: async interaction => {
                    const text = interaction.fields.getTextInputValue('text');
                    const key = interaction.fields.getTextInputValue('key');

                    await interaction.deferReply({ ephemeral: true });

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
                    await interaction.showModal(this.encryptModal(true, interaction.message.id));
                }
            }
        ];

        return true;
    }

    public encryptModal(decrypt: true, messageId: string): APIModalInteractionResponseCallbackData;
    public encryptModal(decrypt?: false): APIModalInteractionResponseCallbackData;
    public encryptModal(decrypt?: boolean, messageId?: string): APIModalInteractionResponseCallbackData {
        const modal = new ModalBuilder({
            title: decrypt ? 'Decrypt Message' : 'Encrypt Message',
            custom_id: decrypt ? `decrypt-modal-${messageId}` : 'encrypt-modal'
        });

        if (!decrypt) {
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