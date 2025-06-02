import { Injectable } from '@nestjs/common'

@Injectable()
export class FavoritesService {
  private favorites: Record<number, Set<string>> = {};

  async isFavorite(userId: number, videoId: string): Promise<boolean> {
    return this.favorites[userId]?.has(videoId) || false
  }

  async addFavorite(userId: number, videoId: string): Promise<void> {
    if (!this.favorites[userId]) {
      this.favorites[userId] = new Set()
    }
    this.favorites[userId].add(videoId)
  }

  async removeFavorite(userId: number, videoId: string): Promise<void> {
    this.favorites[userId]?.delete(videoId)
  }
}
