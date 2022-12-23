import { AutocompleteInteraction, Awaitable, CommandInteraction, Interaction } from 'discord.js';
import { Logger } from 'fallout-utility';
import { BaseModule } from './utility';
import { RecipleClient } from 'reciple';

export interface CommandInteractionEvent {
    type: 'AutoComplete'|'ContextMenu'|'ChatInput';
    commandName: string|((name: string) => Awaitable<boolean>);
    handle: (interaction: AutocompleteInteraction|CommandInteraction) => Awaitable<void>;
}

export interface ComponentInteractionEvent {
    customId: string|((id: string) => Awaitable<boolean>);
    type: 'Button'|'ModalSubmit'|'SelectMenu';
    handle: (interaction: Interaction) => Awaitable<void>;
}

export type AnyInteractionCommandHandler = CommandInteractionEvent|ComponentInteractionEvent;

export class InteractionsModule extends BaseModule {
    public logger!: Logger;

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.logger = client.logger.cloneLogger({ loggerName: `InteractionsHandler` });
        return true;
    }

    public onLoad(client: RecipleClient<boolean>): void {
        client.on('interactionCreate', async interaction => {
            const handlers: AnyInteractionCommandHandler[] = [];

            client.modules.modules.forEach(m => handlers.push(...(m.script as BaseModule).interactionEvents));

            for (const handler of handlers) {
                if (handler.type !== InteractionsModule.getInteractionEventType(interaction)) continue;

                if (handler.type == 'AutoComplete' || handler.type == 'ContextMenu') {
                    await this.handleCommandInteraction(interaction, handler).catch(err => this.logger.err(err));
                } else if (handler.type == 'SelectMenu' || handler.type == 'Button' || handler.type == 'ModalSubmit') {
                    await this.handleComponentInteraction(interaction, handler).catch(err => this.logger.err(err));
                }
            }
        });
    }

    public async handleComponentInteraction(interaction: Interaction, handler: ComponentInteractionEvent): Promise<void> {
        if (interaction.isAutocomplete() || interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return;
        if (
            typeof handler.customId === 'function'
                ? !handler.customId(interaction.customId)
                : handler.customId !== interaction.customId
        ) return;

        return handler.handle(interaction);
    }

    public async handleCommandInteraction(interaction: Interaction, handler: CommandInteractionEvent): Promise<void> {
        if (!interaction.isAutocomplete() && !interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;
        if (
            typeof handler.commandName === 'function'
                ? !handler.commandName(interaction.commandName)
                : handler.commandName !== interaction.commandName
        ) return;

        return handler.handle(interaction);
    }

    public static getInteractionEventType(interaction: Interaction): AnyInteractionCommandHandler['type']|null {
        if (interaction.isAutocomplete()) {
            return 'AutoComplete';
        } else if (interaction.isButton()) {
            return 'Button';
        } else if (interaction.isContextMenuCommand()) {
            return 'ContextMenu';
        } else if (interaction.isModalSubmit()) {
            return 'ModalSubmit';
        } else if (interaction.isAnySelectMenu()) {
            return 'SelectMenu';
        } else if (interaction.isChatInputCommand()) {
            return 'ChatInput';
        }

        return null;
    }
}

export default new InteractionsModule();