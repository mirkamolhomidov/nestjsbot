import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const message = ctx.message as { text?: string };
    const text = message.text;
    if (text) {
      await this.botService.handleSearch(ctx, text);
    }
  }

  async onCallback(@Ctx() ctx: Context) {
    await ctx.answerCbQuery('Qabul qilindi, biroz kuting...');
    await this.botService.handleCallback(ctx);
  }
}
