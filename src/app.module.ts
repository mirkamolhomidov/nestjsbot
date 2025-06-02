import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { BotModule } from './bot/bot.module'
import { UpdateCookiesService } from './utils/updatecookies'
import { YoutubeModule } from './youtube/youtube.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_TOKEN')!,
      }),
    }),
    BotModule,
    YoutubeModule,
  ],
  providers: [UpdateCookiesService]
})
export class AppModule { }
