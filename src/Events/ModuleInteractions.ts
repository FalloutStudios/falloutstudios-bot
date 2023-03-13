import { RecipleClient, RecipleModuleScriptUnloadData } from 'reciple';
import BaseModule from '../BaseModule.js';
import { Interaction } from 'discord.js';
import { AnyCommandInteractionListener, AnyComponentInteractionListener, AnyInteractionListener } from './_InteractionEventTypes.js';
import { Logger } from 'fallout-utility';

export class ModuleInteractions extends BaseModule {
    public client!: RecipleClient;
    public logger?: Logger;

    constructor() {
        super();
        this.onInteractionCreate = this.onInteractionCreate.bind(this);
    }

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.client = client;
        this.logger = client.logger?.clone({ name: 'ModuleInteractions' });

        return true;
    }

    public async onLoad(client: RecipleClient<boolean>): Promise<void> {
        client.on('interactionCreate', this.onInteractionCreate);
        this.logger?.log(`Listening to interactions events!`);
    }

    public async onUnload(data: RecipleModuleScriptUnloadData): Promise<void> {
        data.client.removeListener('interactionCreate', this.onInteractionCreate);
        this.logger?.log(`Unmount interactions event listener from the client`);
    }

    public async onInteractionCreate(interaction: Interaction): Promise<void> {
        await Promise.all(this.client.modules.modules.map(async m => {
            const script = m.script as BaseModule;

            if (!script.interactionEvents?.length) return;

            for (const listener of script.interactionEvents) {
                if (!ModuleInteractions.isCommandInteractionEvent(listener) && !ModuleInteractions.isComponentInteractionEvent(listener)) continue;

                (async () => {
                    switch(listener.type) {
                        case 'Autocomplete':
                            return interaction.isAutocomplete()
                            ? listener.execute(interaction) : null;
                        case 'Button':
                            return interaction.isButton()
                            ? listener.execute(interaction) : null;
                        case 'ChatInput':
                            return interaction.isChatInputCommand()
                            ? listener.execute(interaction) : null;
                        case 'ContextMenu':
                            return interaction.isContextMenuCommand()
                            ? listener.execute(interaction) : null;
                        case 'MessageContextMenu':
                            return interaction.isMessageContextMenuCommand()
                            ? listener.execute(interaction) : null;
                        case 'UserContextMenu':
                            return interaction.isUserContextMenuCommand()
                            ? listener.execute(interaction) : null;
                        case 'ModalSubmit':
                            return interaction.isModalSubmit()
                            ? listener.execute(interaction) : null;
                        case 'SelectMenu':
                            return interaction.isAnySelectMenu()
                            ? listener.execute(interaction) : null;
                        case 'ChannelSelectMenu':
                            return interaction.isChannelSelectMenu()
                            ? listener.execute(interaction) : null;
                        case 'RoleSelectMenu':
                            return interaction.isRoleSelectMenu()
                            ? listener.execute(interaction) : null;
                        case 'StringSelectMenu':
                            return interaction.isStringSelectMenu()
                            ? listener.execute(interaction) : null;
                        case 'UserSelectMenu':
                            return interaction.isUserSelectMenu()
                            ? listener.execute(interaction) : null;
                    }
                })()
                .catch(err => this.logger?.error(`An error occured while executing an event for "${listener.type}":\n`, err));
            }
        }));
    }

    public static isCommandInteractionEvent(eventListener: AnyInteractionListener): eventListener is AnyCommandInteractionListener {
        return eventListener.type === 'Autocomplete' || eventListener.type === 'ChatInput' || eventListener.type === 'ContextMenu' || eventListener.type === 'MessageContextMenu' || eventListener.type === 'UserContextMenu';
    }

    public static isComponentInteractionEvent(eventListener: AnyInteractionListener): eventListener is AnyComponentInteractionListener {
        return eventListener.type === 'Button' || eventListener.type === 'ModalSubmit' || eventListener.type === 'SelectMenu' || eventListener.type === 'ChannelSelectMenu' || eventListener.type === 'RoleSelectMenu' || eventListener.type === 'StringSelectMenu' || eventListener.type === 'UserSelectMenu';
    }
}

export default new ModuleInteractions();