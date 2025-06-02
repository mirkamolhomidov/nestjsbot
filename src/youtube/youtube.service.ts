import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as youtubedl from 'youtube-dl-exec'
import * as ytSearch from 'yt-search'

@Injectable()
export class YoutubeService {
  async search(query: string) {
    try {
      const result = await ytSearch(query)
      return result.videos
    } catch (error) {
      throw new InternalServerErrorException(`Xatolik: ${error}`)
    }
  }
  async downloadMP3(videoId: string): Promise<{ buffer: Buffer; title: string } | null> {
    try {
      const cookiesPath = path.join(process.cwd(), 'cookies.txt')
      const url = `https://www.youtube.com/watch?v=${videoId}`
      const info = (await youtubedl.youtubeDl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        cookies: cookiesPath
      })) as any

      const ffmpegPath = '/usr/bin/ffmpeg'
      const outputPath = `/tmp/${videoId}.mp3`

      await youtubedl.youtubeDl(url, {
        ffmpegLocation: ffmpegPath,
        extractAudio: true,
        audioFormat: 'mp3',
        output: '/tmp/%(id)s.%(ext)s',
        cookies: cookiesPath,
      })
      const buffer = await fs.readFile(outputPath)
      return { buffer, title: info.title }
    } catch (err) {
      console.error('MP3 yuklab olishda xatolik:', err)
      return null
    }
  }
}
