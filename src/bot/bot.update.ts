import { InternalServerErrorException } from '@nestjs/common'
import { Ctx, On, Start, Update } from 'nestjs-telegraf'
import { Context } from 'telegraf'
import { BotService } from './bot.service'

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) { }
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply('Musiqa nomini kiriting.')
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    try {
      const message = ctx.message as { text?: string }
      const text = message.text
      if (text) {
        await this.botService.handleSearch(ctx, text)
      }
    } catch (error) {
      throw new InternalServerErrorException(`Xatolik: ${error}`)
    }
  }
  @On('callback_query')
  async onCallback(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery('Qabul qilindi, biroz kuting...')
      await this.botService.handleCallback(ctx)
    } catch (error) {
      throw new InternalServerErrorException(`Xatolik: ${error}`)
    }
  }
}
