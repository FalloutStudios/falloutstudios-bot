import { createConfig } from './_createConfig';

import { EmbedBuilder, TextBasedChannel } from 'discord.js';
import path from 'path';
import { RecipleClient, RecipleScript } from 'reciple';
import yml from 'yaml';

export interface WelcomerConfig {
    welcomeChannel: string;
    goodByeChannel: string;
    welcomeContent: string;
    goodByeContent: string;
}

export class Welcomer implements RecipleScript {
    public versions: string = '^3.0.0';
    public config: WelcomerConfig = Welcomer.getConfig();
    public welcome!: TextBasedChannel;
    public goodbye?: TextBasedChannel;

    public onStart(): boolean {
        return true;
    }

    public async onLoad(client: RecipleClient): Promise<void> {
        const welcome = client.channels.cache.get(this.config.welcomeChannel) ?? await client.channels.fetch(this.config.welcomeChannel).catch(() => null);
        const goodbye = client.channels.cache.get(this.config.goodByeChannel) ?? await client.channels.fetch(this.config.goodByeChannel).catch(() => null);
        
        if (!welcome || !welcome.isTextBased()) throw new Error('Can\'t resolve welcome text channel');
        if (goodbye && !goodbye.isTextBased()) throw new Error('Can\'t resolve goodbye text channel');

        this.welcome = welcome;
        this.goodbye = goodbye ?? undefined;

        client.on('guildMemberAdd', member => {
            welcome.send({
                content: this.config.welcomeContent || undefined,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: ` Welcome ${member.user.tag}`,
                            iconURL: member.user.displayAvatarURL()
                        })
                        .setColor('Blurple')
                ]
            }).catch(() => null);
        });

        client.on('guildMemberRemove', member => {
            goodbye?.send({
                content: this.config.goodByeContent || undefined,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${member.user} left the server`,
                            iconURL: member.user.displayAvatarURL()
                        })
                        .setColor('Grey')
                ]
            }).catch(() => null);
        });
    }

    public static getConfig(): WelcomerConfig {
        const configPath = path.join(process.cwd(), 'config/welcomer/config.yml');
        const defaultConfig: WelcomerConfig = {
            welcomeChannel: '000000000000000000',
            goodByeChannel: '000000000000000000',
            welcomeContent: '',
            goodByeContent: ''
        };

        return yml.parse(createConfig(configPath, defaultConfig));
    }
}

export default new Welcomer();