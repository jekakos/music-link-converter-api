import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IMusicService } from './service.interface';

@Injectable()
export class VkMusicService implements IMusicService {
  private apiBaseUrl = 'https://api.vk.com/method';
  private accessToken: string;
  private api_version: string;

  constructor(private readonly configService: ConfigService) {
    this.accessToken = this.configService.get<string>('VK_ACCESS_TOKEN') ?? '';
    this.api_version = this.configService.get<string>('VK_API_VERSION') ?? '';
  }

  async searchTrack(artist: string, title: string): Promise<string | null> {
    try {
      const query = `${artist} ${title}`;

      const response = await axios.get(`${this.apiBaseUrl}/audio.search`, {
        params: {
          q: query,
          access_token: this.accessToken,
          v: this.api_version,
        },
      });

      const data = response.data.response;
      if (data && data.count > 0) {
        const firstTrack = data.items[0];
        return firstTrack.url;
      } else {
        return null;
      }
    } catch (err) {
      console.error('Error searching tracks:', err);
      throw err;
    }
  }

  async getTrackInfo(
    vkMusicUrl: string,
  ): Promise<{ artist: string; title: string }> {
    try {
      // Извлекайте информацию о треке из URL и используйте VK API для получения дополнительных данных.
      const trackId = this.extractTrackIdFromUrl(vkMusicUrl);

      const response = await axios.get(`${this.apiBaseUrl}/audio.getById`, {
        params: {
          audios: trackId,
          access_token: this.api_version,
          v: this.api_version,
        },
      });

      const data = response.data.response[0];
      const artist = data.artist;
      const title = data.title;
      return { artist, title };
    } catch (err) {
      console.error('Error getting track info:', err);
      throw err;
    }
  }

  private extractTrackIdFromUrl(url: string): string {
    // Извлекайте ID трека из URL VK Music, например: 'audio12345_678910'
    const match = url.match(/audio(\d+)_(\d+)/);
    if (!match || match.length < 3) {
      throw new Error('Invalid VK Music URL');
    }
    return `${match[1]}_${match[2]}`;
  }
}
