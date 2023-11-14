import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IMusicService } from './service.interface.js';
import he from 'he';

@Injectable()
export class YoutubeMusicService implements IMusicService {
  private apiKey?: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
  }

  private async search(query: string): Promise<any> {
    const url = `${this.baseUrl}/search`;
    const params = {
      q: query,
      part: 'snippet',
      type: 'video',
      key: this.apiKey,
      videoCategoryId: '10', // Category for Music
      maxResults: 1,
    };
    const response = await axios({
      method: 'GET',
      url: url,
      params: params,
    });

    if (response && response.data.items && response.data.items.length > 0)
      return response.data.items[0];

    return null;
  }

  async searchTrack(artist: string, title: string): Promise<string | null> {
    try {
      const query = `${artist} - ${title}`;
      const track = await this.search(query);
      if (track && 'id' in track) {
        const videoId = track.id.videoId;
        return `https://music.youtube.com/watch?v=${videoId}`;
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw new Error('Not found');
    }
    throw new Error('Not found');
  }

  async getTrackInfo(
    youtubeUrl: string,
  ): Promise<{ artist: string; title: string } | null> {
    try {
      const videoIdMatch = youtubeUrl.match(/v=([^&]+)/);
      if (!videoIdMatch) {
        throw new Error('Invalid YouTube URL');
      }
      const videoId = videoIdMatch[1];

      const query = `${videoId}`;
      const info = await this.search(query);
      console.log('Youtube info: ', info);
      if (info && 'snippet' in info) {
        let cleanTitle = '';
        if (info.snippet.title) {
          cleanTitle = this.cleanTrackTitle(info.snippet.title);
          console.log('Title: ', cleanTitle);
          //const titleMatch = cleanTitle.match(/(.+) - (.+)/);
          if (!cleanTitle) {
            throw new Error('Unexpected title format');
          }
        }

        let cleanArtist = '';
        if (info.snippet.channelTitle) {
          cleanArtist = this.cleanTrackTitle(info.snippet.channelTitle).replace(
            ' - Topic',
            '',
          );
          console.log('Artist: ', cleanArtist);
          //const titleMatch = cleanTitle.match(/(.+) - (.+)/);
          if (!cleanArtist) {
            throw new Error('Unexpected artist format');
          }
        }

        return {
          artist: cleanArtist,
          title: cleanTitle,
        };
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
    }
    return null;
  }

  private cleanTrackTitle(title: string): string {
    title = he.decode(title);
    //title = title.replace(/&quot;/g, '');
    //title = title.replace(/&amp;/g, '&');

    // Удаление всех символов, которые не являются буквами, цифрами, пробелами, тире
    //title = title.replace(/[^a-zA-Z0-9 \-'`&]/g, '');
    title = title.trim();

    return title;
  }
}
