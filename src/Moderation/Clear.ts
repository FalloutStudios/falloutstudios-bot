import { ContextMenuCommandBuilder, RecipleClient } from 'reciple';
import BaseModule from '../BaseModule.js';
import { ApplicationCommandType, Collection, Message, PartialMessage } from 'discord.js';

export class Clear extends BaseModule {
    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new ContextMenuCommandBuilder()
                .setName('Clear Msgs Below')
                .setRequiredMemberPermissions('ManageMessages')
                .setType(ApplicationCommandType.Message)
                .setExecute(async ({ interaction }) => {
                    if (!interaction.isMessageContextMenuCommand() || !interaction.inCachedGuild()) return;

                    await interaction.deferReply({ ephemeral: true });

                    const channel = interaction.channel;
                    const messages = await channel?.messages.fetch({ after: interaction.targetId }).catch(() => null);

                    if (!messages?.size) {
                        await interaction.editReply(`No messages found below ${interaction.targetMessage.url}`);
                        return;
                    }

                    await interaction.editReply(`Deleting **${messages.size}** message${messages.size > 1 ? 's' : ''}`);

                    let deletedSize: number = 0;

                    const deleted: Collection<string, Message|PartialMessage> = (
                            await channel?.bulkDelete(messages, true).catch(() => null)
                        )?.filter(Boolean) as Collection<string, Message|PartialMessage> || new Collection();

                        deletedSize = deleted.size;

                    const oldMessages = messages.filter(i => !deleted.some(m => m.id === i.id));

                    for (const [oldMessageId, oldMessage] of oldMessages) {
                        const deleted = await oldMessage.delete().catch(() => null);

                        if (deleted) {
                            oldMessages.delete(oldMessageId);
                            deletedSize++;
                        }
                    }

                    const undeletedSize: number = messages.size - deletedSize;

                    await interaction.editReply(
                        `Deleted **${deletedSize}** message${deletedSize > 1 ? 's' : ''}` +
                        (undeletedSize
                            ? ` with **${undeletedSize}** error${undeletedSize > 1 ? 's' : ''}`
                            : ''
                        )
                    );
                })
        ];

        return true;
    }
}

export default new Clear();