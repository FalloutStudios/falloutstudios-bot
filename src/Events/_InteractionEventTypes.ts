import { AnySelectMenuInteraction, AutocompleteInteraction, Awaitable, ButtonInteraction, ChannelSelectMenuInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserContextMenuCommandInteraction, UserSelectMenuInteraction } from 'discord.js';

export interface InteractionListeners {
    Autocomplete: AutocompleteInteraction;

    Button: ButtonInteraction;

    ChatInput: ChatInputCommandInteraction;

    ContextMenu: ContextMenuCommandInteraction;
    MessageContextMenu: MessageContextMenuCommandInteraction;
    UserContextMenu: UserContextMenuCommandInteraction;

    ModalSubmit: ModalSubmitInteraction;

    SelectMenu: AnySelectMenuInteraction;
    ChannelSelectMenu: ChannelSelectMenuInteraction;
    RoleSelectMenu: RoleSelectMenuInteraction;
    StringSelectMenu: StringSelectMenuInteraction;
    UserSelectMenu: UserSelectMenuInteraction;
};

export type InteractionListenerType = keyof InteractionListeners;
export type CommandInteractionListenerType = 'Autocomplete'|'ContextMenu'|'UserContextMenu'|'MessageContextMenu'|'ChatInput';
export type ComponentInteractionListenerType = Exclude<InteractionListenerType, CommandInteractionListenerType>;

export interface BaseInteractionListener<T extends InteractionListenerType> {
    type: T;
    execute: (interaction: InteractionListeners[T]) => any;
}

export interface BaseCommandInteractionListener<T extends CommandInteractionListenerType> extends BaseInteractionListener<T> {
    commandName?: string|((commandName: string, interaction: InteractionListeners[T]) => Awaitable<boolean>);
}

export interface BaseComponentInteractionListener<T extends ComponentInteractionListenerType> extends BaseInteractionListener<T> {
    customId?: string|((customId: string, interaction: InteractionListeners[T]) => Awaitable<boolean>);
}

export interface AutocompleteInteractionListener extends BaseCommandInteractionListener<'Autocomplete'> {}

export interface ButtonInteractionListener extends BaseComponentInteractionListener<'Button'> {}

export interface ChatInputCommandInteractionListener extends BaseCommandInteractionListener<'ChatInput'> {}

export interface ContextMenuCommandInteractionListener extends BaseCommandInteractionListener<'ContextMenu'> {}
export interface MessageContextMenuCommandInteractionListener extends BaseCommandInteractionListener<'MessageContextMenu'> {}
export interface UserContextMenuCommandInteractionListener extends BaseCommandInteractionListener<'UserContextMenu'> {}

export interface ModalSubmitInteractionListener extends BaseComponentInteractionListener<'ModalSubmit'> {}

export interface SelectMenuInteractionListener extends BaseComponentInteractionListener<'SelectMenu'> {}
export interface ChannelSelectMenuInteractionListener extends BaseComponentInteractionListener<'ChannelSelectMenu'> {}
export interface RoleSelectMenuInteractionListener extends BaseComponentInteractionListener<'RoleSelectMenu'> {}
export interface StringSelectMenuInteractionListener extends BaseComponentInteractionListener<'StringSelectMenu'> {}
export interface UserSelectMenuInteractionListener extends BaseComponentInteractionListener<'UserSelectMenu'> {}

export type AnyContextMenuInteractionListener = ContextMenuCommandInteractionListener|MessageContextMenuCommandInteractionListener|UserContextMenuCommandInteractionListener;
export type AnySelectMenuInteractionListener = SelectMenuInteractionListener|ChannelSelectMenuInteractionListener|RoleSelectMenuInteractionListener|StringSelectMenuInteractionListener|UserSelectMenuInteractionListener;

export type AnyCommandInteractionListener = AutocompleteInteractionListener|ChatInputCommandInteractionListener|AnyContextMenuInteractionListener;
export type AnyComponentInteractionListener = ButtonInteractionListener|ModalSubmitInteractionListener|AnySelectMenuInteractionListener;

export type AnyInteractionListener = AnyCommandInteractionListener|AnyComponentInteractionListener;