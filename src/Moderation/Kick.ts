import { RecipleClient, SlashCommandBuilder } from 'reciple';
import Utility from '../Internals/Utility.js';
import BaseModule from '../BaseModule.js';

export class Kick extends BaseModule {
    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kick a member')
                .setRequiredMemberPermissions('KickMembers')
                .addUserOption(member => member
                    .setName('target')
                    .setDescription('User to kick')
                    .setRequired(true)
                )
                .addStringOption(reason => reason
                    .setName('reason')
                    .setDescription('Reason for kick')
                )
                .setExecute(async ({ interaction }) => {
                    if (!interaction.inCachedGuild()) return;

                    const targetUser = interaction.options.getUser('target', true);
                    const reason = interaction.options.getString('reason');

                    await interaction.deferReply();

                    const targetMember = await Utility.resolveFromCachedManager(targetUser.id, interaction.guild.members);
                    if (!targetMember) await interaction.editReply('Member not found')
                    if (!targetMember.kickable) await interaction.editReply('Unable to kick this user');

                    await targetMember.kick(reason || undefined);

                    await interaction.editReply(`<:kick:1093052742840352778> **${targetUser.tag}** kicked from the server`);
                })
        ];

        return true;
    }
}

export default new Kick();