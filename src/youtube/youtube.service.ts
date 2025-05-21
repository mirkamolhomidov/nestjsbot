import { Injectable } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import * as youtubedl from 'youtube-dl-exec'
import * as ytSearch from 'yt-search'

@Injectable()
export class YoutubeService {
  async search(query: string) {
    const result = await ytSearch(query)
    return result.videos
  }

  async downloadMP3(
    videoId: string,
  ): Promise<{ buffer: Buffer; title: string } | null> {
    const tmpDir = os.tmpdir()
    const filePath = path.join(tmpDir, `${videoId}.mp3`)
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const ytdlOptions = {
      dumpSingleJson: true,
      noWarnings: true,
      cookies: '/root/nestjsbot/cookies.txt',
    } as any
    const info = await youtubedl.youtubeDl(url, ytdlOptions) as any
    const ffmpegPath =
      '/usr/bin/ffmpeg'

    await youtubedl.youtubeDl(url, {
      ffmpegLocation: ffmpegPath,
      extractAudio: true,
      audioFormat: 'mp3',
      output: path.join(tmpDir, '%(id)s.%(ext)s'),
      cookies: '/root/nestjsbot/cookies.txt',
    })

    try {
      const buffer = await fs.readFile(filePath)
      return { buffer, title: info.title }
    } catch (err) {
      return null
    }
  }
}
