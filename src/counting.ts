import { RecipleClient, RecipleScript } from 'reciple';
import { createConfig } from './_createConfig';
import path from 'path';
import yml from 'yaml';

export class Counting implements RecipleScript {
    public versions: string = '1.7.x';
    public channels: string[] = Counting.getConfig();

    public onStart(client: RecipleClient<boolean>): boolean | Promise<boolean> {
        client.on('messageCreate', async message => {
            if (!this.channels.includes(message.channelId)) return;
            
            const content = Number(message.content);
            if (isNaN(content) || message.attachments.size) {
                message.delete().catch(() => {});
                return;
            }

            const messageBefore = await message.channel.messages.fetch({ before: message.id, limit: 1 }).then(m => m.first()).catch(() => undefined);
            if (!messageBefore || isNaN(Number(messageBefore.content)) || Number(messageBefore.content) !== (content - 1 || 0)) {
                message.delete().catch(() => {});
                return;
            }

            message.suppressEmbeds(true).catch(() => {});
        });
        
        return true;
    }

    public static getConfig(): string[] {
        const configPath = path.join(process.cwd(), 'config/counting/config.yml');

        return yml.parse(createConfig(configPath, ['00000000000000000000','00000000000000000000'])) || [];
    }
}

export default new Counting();