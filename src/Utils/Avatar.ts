import { ContextMenuCommandBuilder, RecipleClient, SlashCommandBuilder } from 'reciple';
import BaseModule from '../BaseModule.js';
import { ApplicationCommandType, EmbedBuilder, GuildMember, User } from 'discord.js';
import Config from '../Config.js';

export class Avatar extends BaseModule {
    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('avatar')
                .setDescription('Get a user\'s avatar')
                .setDMPermission(false)
                .addUserOption(user => user
                    .setName('user')
                    .setDescription('User to get avatar from')
                    .setRequired(true)
                )
                .setExecute(async ({ interaction }) => {
                    if (!interaction.inCachedGuild()) return;

                    const user = interaction.options.getUser('user', true);
                    const member = interaction.guild.members.cache.get(user.id);

                    await interaction.reply({
                        embeds: [
                            this.getAvatarEmbed(member ?? user)
                                .setAuthor({ name: interaction.user.tag, iconURL: interaction.member.displayAvatarURL({ extension: 'png', size: 512 }) })
                        ]
                    });
                }),
            new ContextMenuCommandBuilder()
                .setName('Avatar')
                .setType(ApplicationCommandType.User)
                .setDMPermission(false)
                .setExecute(async ({ interaction }) => {
                    if (!interaction.inCachedGuild() || !interaction.isUserContextMenuCommand()) return;

                    await interaction.reply({
                        embeds: [
                            this.getAvatarEmbed(interaction.targetMember)
                                .setAuthor({ name: interaction.user.tag, iconURL: interaction.member.displayAvatarURL({ extension: 'png', size: 512 }) })
                        ]
                    });
                })
        ];

        return true;
    }

    public getAvatarEmbed(user: User|GuildMember): EmbedBuilder {
        const name = user instanceof User ? user.username : user.displayName;

        return new EmbedBuilder()
            .setTitle(`${name} | Avatar`)
            .setColor(Config.config.embedColor)
            .setImage(user.displayAvatarURL({ extension: 'gif', size: 1024 }));
    }
}

export default new Avatar();