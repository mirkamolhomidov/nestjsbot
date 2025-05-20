import { Module } from '@nestjs/common';
import { YoutubeModule } from 'src/youtube/youtube.module';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
  imports: [YoutubeModule],
  providers: [BotUpdate, BotService],
})
export class BotModule {}
