import { InteractionCommandBuilder, MessageCommandBuilder, RecipleClient, recipleCommandBuilders, RecipleScript } from 'reciple';
import { Message, MessageEmbed } from 'discord.js';
import { errorEmbed } from './_errorEmbed';
import ms from 'ms';

export default new (class implements RecipleScript {
    public versions: string[] = ['1.6.x'];
    public commands: recipleCommandBuilders[] = [];

    public onStart(client: RecipleClient) {
        this.commands = [
            new MessageCommandBuilder()
                .setName('ping')
                .addAliases('pong')
                .setDescription('Pong!')
                .setExecute(async command => {
                    const message = command.message;
                    const reply = await message.reply({
                        embeds: [
                            errorEmbed('Loading', true)
                        ]
                    });

                    reply.edit({ embeds: [this.getEmbed(client, reply)] });
                }),
                new InteractionCommandBuilder()
                    .setName('ping')
                    .setDescription('Shows bot latency')
                    .setExecute(async command => {
                        const interaction = command.interaction;

                        await interaction.deferReply();

                        const reply = await interaction.fetchReply() as Message;
                        await interaction.editReply({ embeds: [this.getEmbed(client, reply)] });
                    })
            ];

        return true;
    }

    public getEmbed(client: RecipleClient, reply: Message) {
        const latency = Date.now() - reply.createdTimestamp;
        const apiLatency = client.ws.ping;

        return new MessageEmbed()
            .setAuthor({ name: 'Pong!', iconURL: client.user?.displayAvatarURL() })
            .setDescription(`\`\`\`bash\nBot Latency: ${ms(latency < 0 ? 0 : latency, { long: true })}\nWS Latency: ${ms(apiLatency < 0 ? 0 : apiLatency, { long: true })}\nUptime: ${ms(process.uptime() * 1000, { long: true })}\`\`\``)
            .setColor('GREEN');
    }
})();
