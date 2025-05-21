import { Ctx, On, Update } from 'nestjs-telegraf'
import { Context } from 'telegraf'
import { BotService } from './bot.service'

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) { }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const message = ctx.message as { text?: string }
    const text = message.text
    if (text) {
      await this.botService.handleSearch(ctx, text)
    }
  }

  @On('callback_query')
  async onCallback(@Ctx() ctx: Context) {
    await this.botService.handleCallback(ctx)
  }

}
