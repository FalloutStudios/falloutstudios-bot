import { RecipleClient, SlashCommandBuilder } from 'reciple';
import utility, { BaseModule } from '../utility';
import { Client } from 'discord.js';
import ms from 'ms';

export class PingCommandModule extends BaseModule {
    public async onStart(client: RecipleClient<false>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Get bot api latency')
                .setDMPermission(true)
                .setExecute(async ({ interaction }) => {
                    const restPing = this.getRestLatency(interaction.createdAt);
                    const webSocketPing = this.getWebSocketLatency(client);

                    await interaction.reply({
                        embeds: [
                            utility.createSmallEmbed(`${utility.user.tag} ping`)
                                .addFields(
                                    {
                                        name: `Rest latency`,
                                        value: ms(restPing, { long: true }),
                                        inline: true
                                    },
                                    {
                                        name: `WebSocket latency`,
                                        value: ms(webSocketPing, { long: true }),
                                        inline: true
                                    }
                                )
                        ]
                    });
                })
        ];

        return true;
    }

    public getWebSocketLatency(client: Client): number {
        return client.ws.ping;
    }

    public getRestLatency(initTime: Date|number): number {
        initTime = typeof initTime === 'number' ? initTime : initTime.getTime();

        return Date.now() - initTime;
    }
}

export default new PingCommandModule();