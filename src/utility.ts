import { AnyCommandBuilder, AnyCommandData, RecipleClient, RecipleScript, cwd, path } from 'reciple';
import { Config, createConfig, defaultConfig } from './util/config';
import { AnyInteractionCommandHandler } from './interactions';
import { Collection, EmbedBuilder } from 'discord.js';

export abstract class BaseModule implements RecipleScript {
    public commands: (AnyCommandBuilder | AnyCommandData)[]  = [];
    public interactionEvents: AnyInteractionCommandHandler[] = [];
    public versions: string[] = ['^6'];

    public abstract onStart(client: RecipleClient<false>): Promise<boolean>;
    public onLoad(client: RecipleClient<true>): void | Promise<void> {}
    public onUnload(reason: unknown, client: RecipleClient<true>): void | Promise<void> {}
}

export class Utility extends BaseModule {
    public client!: RecipleClient;
    public config: Config = createConfig<Config>(path.join(cwd, 'config/config.json'), defaultConfig, {
        formatData: data => JSON.parse(data),
        stringifyData: data => JSON.stringify(data, null, 4)
    });

    get logger() { return this.client.logger; }
    get user() { return this.client.user!; }

    public async onStart(client: RecipleClient<false>): Promise<boolean> {
        this.client = client;

        client.config.commands.slashCommand.guilds = [
            ...(typeof client.config.commands.slashCommand.guilds === 'string'
                ? [client.config.commands.slashCommand.guilds]
                :  client.config.commands.slashCommand.guilds ?? []).filter(id => id !== this.config.guildId),
            this.config.guildId
        ];

        return true;
    }

    public createSmallEmbed(content: string, options?: { userDescription?: boolean; dontAddClientAvatar?: boolean; errorTheme?: boolean; }): EmbedBuilder {
        return new EmbedBuilder({
            author: options?.userDescription
                ? undefined
                : {
                    name: content,
                    icon_url: options?.dontAddClientAvatar === true
                        ? undefined
                        : this.client.user?.displayAvatarURL()
                },
            description: options?.userDescription ? content : undefined
        }).setColor(options?.errorTheme ? this.config.errorEmbedColor : this.config.defaultEmbedColor);
    }

    public async resolveFromManagers<T extends unknown, M extends { cache: Collection<string, T>; fetch: (id: string) => Promise<T|null> }>(id: string, manager: M): Promise<T|undefined> {
        return manager.cache.get(id) || await manager.fetch(id).catch(() => undefined) || undefined;
    }
}

export default new Utility();