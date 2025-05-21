import { Injectable } from '@nestjs/common'
import { YoutubeService } from 'src/youtube/youtube.service'
import { Context } from 'telegraf'
import { CallbackQuery } from 'telegraf/typings/core/types/typegram'

@Injectable()
export class BotService {
  constructor(private readonly youtubeService: YoutubeService) { }

  private userStates: Record<number, { videos: any[]; page: number }> = {};

  async handleSearch(ctx: Context, query: string) {
    const chatId = ctx.chat?.id
    if (!chatId) return

    const loading = await ctx.reply('🔎 Qidirilmoqda...')

    try {
      const videos = await this.youtubeService.search(query)
      if (!videos.length) {
        await ctx.reply('Hech narsa topilmadi.')
        return
      }

      this.userStates[chatId] = { videos, page: 1 }
      this.sendResults(ctx, chatId, 1)
    } catch (err: any) {
      await ctx.reply('Xatolik yuz berdi: ' + err.message)
    } finally {
      ctx.deleteMessage(loading.message_id).catch(() => { })
    }
  }

  async sendResults(ctx: Context, chatId: number, page: number) {
    const state = this.userStates[chatId]
    if (!state) return

    const { videos } = state
    const pageSize = 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageVideos = videos.slice(start, end)
    let messageText = `🔍 Natijalar ${start + 1}-${Math.min(end, videos.length)} / ${videos.length}:\n\n`
    pageVideos.forEach((video, i) => {
      messageText += `${start + i + 1}. ${video.title} (${video.timestamp}) - ${video.views} views\n`
    })
    const numButtons = pageVideos.map((video, i) => ({
      text: `${start + i + 1}`,
      callback_data: `select_${video.videoId || video.video_id}`,
    }))
    const controlButtons = [
      { text: '◀️', callback_data: 'prev' },
      { text: '❌', callback_data: 'delete' },
      { text: '▶️', callback_data: 'next' },
    ]
    try {
      await ctx.editMessageText(messageText, {
        reply_markup: {
          inline_keyboard: [
            numButtons.slice(0, 5),
            numButtons.slice(5),
            controlButtons,
          ],
        },
      })
    } catch (e) {
      await ctx.telegram.sendMessage(chatId, messageText, {
        reply_markup: {
          inline_keyboard: [
            numButtons.slice(0, 5),
            numButtons.slice(5),
            controlButtons,
          ],
        },
      })
    }
    this.userStates[chatId].page = page
  }


  async handleCallback(ctx: Context) {
    const chatId = ctx.chat?.id
    if (!chatId) return
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery
    const data = callbackQuery.data

    if (!data) return

    const state = this.userStates[chatId]
    if (!state)
      return ctx.answerCbQuery('❌ Hech narsa topilmadi', { show_alert: true })

    await ctx.answerCbQuery()

    if (data === 'prev') {
      const prevPage = Math.max(state.page - 1, 1)
      await this.sendResults(ctx, chatId, prevPage)
    } else if (data === 'next') {
      const totalPages = Math.ceil(state.videos.length / 10)
      const nextPage = Math.min(state.page + 1, totalPages)
      await this.sendResults(ctx, chatId, nextPage)
    } else if (data === 'delete') {
      await ctx.deleteMessage(callbackQuery.message?.message_id).catch(() => { })
    } else if (data.startsWith('select_')) {
      const videoId = data.substring('select_'.length)
      const loadingMessage = await ctx.reply('⏳ Musiqa tayyorlanmoqda uzog\'i 3sekund...')
      const result = await this.youtubeService.downloadMP3(videoId)
      if (!result) {
        await ctx.reply('❌ Yuklab bo‘lmadi')
        return
      }
      const { buffer, title } = result
      await ctx.replyWithAudio({ source: buffer, filename: `${title}.mp3` })
      await ctx.deleteMessage(loadingMessage.message_id).catch(() => { })
    }
  }
}
