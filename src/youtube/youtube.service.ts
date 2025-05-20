import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as youtubedl from 'youtube-dl-exec';
import * as ytSearch from 'yt-search';

@Injectable()
export class YoutubeService {
  async search(query: string) {
    const result = await ytSearch(query);
    return result.videos;
  }

  async downloadMP3(
    videoId: string,
  ): Promise<{ buffer: Buffer; title: string } | null> {
    const filePath = path.join('/tmp', `${videoId}.mp3`);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = (await youtubedl.youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
    })) as any;
    const ffmpegPath =
      'C:\\Program Files\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe';

    await youtubedl.youtubeDl(url, {
      ffmpegLocation: ffmpegPath,
      extractAudio: true,
      audioFormat: 'mp3',
      output: '\\tmp\\%(id)s.%(ext)s',
    });

    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, title: info.title };
    } catch (err) {
      return null;
    }
  }
}
