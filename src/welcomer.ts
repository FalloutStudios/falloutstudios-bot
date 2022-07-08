import { RecipleClient, RecipleScript } from 'reciple';
import path from 'path';
import yml from 'yaml';
import { createConfig } from './_createConfig';
import { MessageEmbed, TextBasedChannel } from 'discord.js';

export interface WelcomerConfig {
    welcomeChannel: string;
    goodByeChannel: string;
    welcomeContent: string;
    goodByeContent: string;
}

export class Welcomer implements RecipleScript {
    public versions: string = '1.7.x';
    public config: WelcomerConfig = Welcomer.getConfig();
    public welcome!: TextBasedChannel;
    public goodbye?: TextBasedChannel;

    public onStart(): boolean {
        return true;
    }

    public async onLoad(client: RecipleClient): Promise<void> {
        const welcome = client.channels.cache.get(this.config.welcomeChannel) ?? await client.channels.fetch(this.config.welcomeChannel).catch(() => null);
        const goodbye = client.channels.cache.get(this.config.goodByeChannel) ?? await client.channels.fetch(this.config.goodByeChannel).catch(() => null);
        
        if (!welcome || !welcome.isText()) throw new Error('Can\'t resolve welcome text channel');
        if (goodbye && !goodbye.isText()) throw new Error('Can\'t resolve goodbye text channel');

        this.welcome = welcome;
        this.goodbye = goodbye ?? undefined;

        client.on('guildMemberAdd', member => {
            welcome.send({
                content: this.config.welcomeContent || undefined,
                embeds: [
                    new MessageEmbed()
                        .setAuthor({
                            name: ` Welcome ${member.user.tag}`,
                            iconURL: member.user.displayAvatarURL()
                        })
                        .setColor('BLURPLE')
                ]
            }).catch(() => null);
        });

        client.on('guildMemberRemove', member => {
            goodbye?.send({
                content: this.config.goodByeContent || undefined,
                embeds: [
                    new MessageEmbed()
                        .setAuthor({
                            name: `${member.user} left the server`,
                            iconURL: member.user.displayAvatarURL()
                        })
                        .setColor('GREY')
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