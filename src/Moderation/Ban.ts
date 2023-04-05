import { RecipleClient, SlashCommandBuilder } from 'reciple';
import Utility from '../Internals/Utility.js';
import BaseModule from '../BaseModule.js';
import ms from 'ms';

export class Ban extends BaseModule {
    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('ban')
                .setDescription('Ban a member')
                .addUserOption(member => member
                    .setName('target')
                    .setDescription('User to ban')
                    .setRequired(true)
                )
                .addStringOption(reason => reason
                    .setName('reason')
                    .setDescription('Reason for banning')
                )
                .addStringOption(deleteMessages => deleteMessages
                    .setName('deleted-messages')
                    .setDescription('How much of their recent messages history to delete')
                    .setRequired(false)
                )
                .setExecute(async ({ interaction }) => {
                    if (!interaction.inCachedGuild()) return;

                    const targetUser = interaction.options.getUser('target', true);
                    const reason = interaction.options.getString('reason');
                    const deleteMessages = interaction.options.getString('delete-messages');
                    const deleteMessagesMs = deleteMessages ? ms(deleteMessages) : undefined;

                    await interaction.deferReply();

                    const targetMember = await Utility.resolveFromCachedManager(targetUser.id, interaction.guild.members);
                    if (!targetMember) await interaction.editReply('Member not found')
                    if (!targetMember.bannable) await interaction.editReply('Unable to ban this user');

                    await targetMember.ban({
                        reason: reason || undefined,
                        deleteMessageSeconds: deleteMessagesMs ? (deleteMessagesMs / 1000) : undefined
                    });

                    await interaction.editReply(`<:ban:1093051725142818876> **${targetUser.tag}** banned from the server`);
                })
        ];

        return true;
    }
}

export default new Ban();