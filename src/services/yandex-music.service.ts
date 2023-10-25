import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IMusicService } from './service.interface.js';

@Injectable()
export class YandexMusicService implements IMusicService {
  constructor(private readonly configService: ConfigService) {}

  async searchTrack(artist: string, title: string): Promise<string | null> {
    const internalServiceUrl = this.configService.get<string>(
      'INTERNAL_YANDEXMUSIC_SERVICE_URL',
    );

    const url = `${internalServiceUrl}/get_track_link?artist=${encodeURIComponent(
      artist,
    )}&title=${encodeURIComponent(title)}`;

    console.log(url);

    try {
      const response = await axios({
        method: 'GET',
        url: url,
      }).catch(() => {
        throw new ForbiddenException('API not available');
      });

      if (response && response.data && response.data.track_url) {
        return response.data.track_url;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching track from Yandex Music:', error);
      throw new Error('Unable to fetch track');
    }
  }

  async getTrackInfo(
    yandexUrl: string,
  ): Promise<{ artist: string; title: string }> {
    const trackId = this.extractTrackIdFromUrl(yandexUrl);
    const internalServiceUrl = this.configService.get<string>(
      'INTERNAL_YANDEXMUSIC_SERVICE_URL',
    );
    const url = `${internalServiceUrl}/get_track_info?trackId=${encodeURIComponent(
      trackId,
    )}`;
    let response;

    try {
      response = await axios({
        method: 'GET',
        url: url,
      }).catch(() => {
        throw new ForbiddenException('API not available');
      });
    } catch (error) {
      console.error('Error fetching track info from Yandex Music:', error);
      throw new Error('Unable to fetch track info');
    }

    if (
      response &&
      response.data &&
      response.data.artist &&
      response.data.title
    ) {
      return {
        artist: response.data.artist,
        title: response.data.title,
      };
    }

    throw new Error('Unable to fetch track info');
  }

  private extractTrackIdFromUrl(url: string): string {
    const match = url.match(/track\/([^/?]+)/);
    if (!match) {
      throw new Error('Invalid Yandex Music URL');
    }
    return match[1];
  }
}
