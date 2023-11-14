import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import { IMusicService } from './service.interface';
const { sign, decode, verify } = jsonwebtoken;

@Injectable()
export class AppleMusicService implements IMusicService {
  private accessToken: string;
  private tokenExpiresAt: number;

  constructor(private configService: ConfigService) {}

  private generateAccessToken(): void {
    const teamId = this.configService.get<string>('APPLE_TEAM_ID');
    const keyId = this.configService.get<string>('APPLE_KEY_ID');
    const secret = this.configService.get<string>('APPLE_PRIVATE_KEY');

    const token = sign({}, secret!, {
      algorithm: 'ES256',
      expiresIn: '1d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId,
      },
    });

    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + 24 * 3600 * 1000 - 10000; // 1 day expiry minus 10 seconds buffer
  }

  private async ensureAccessToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      this.generateAccessToken();
    }
  }

  async searchTrack(artist: string, title: string): Promise<string | null> {
    await this.ensureAccessToken();
    console.log('Apple Music token = ', this.accessToken);
    console.log('Searching: ' + artist + ' - ' + title);

    try {
      const url =
        'https://api.music.apple.com/v1/catalog/us/search?term=' +
        artist +
        '+' +
        title;
      console.log(url);

      const response = await axios({
        method: 'GET',
        url: url,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (
        response.data &&
        response.data.results.songs.data &&
        response.data.results.songs.data.length > 0
      ) {
        return response.data.results.songs.data[0].attributes.url;
      } else {
        throw new Error('Track not found');
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw new Error('Not found');
    }
    return null;
  }

  async getTrackInfo(
    url: string,
  ): Promise<{ artist: string; title: string } | null> {
    await this.ensureAccessToken();
    console.log('Apple Music token = ', this.accessToken);

    const songIdMatch = url.match(/i=([^&]+)/);
    if (!songIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    const songId = songIdMatch[1];
    console.log('Song ID = ', songId);

    try {
      const response = await axios({
        method: 'GET',
        url:
          'https://api.music.apple.com/v1/catalog/us/songs?filter[equivalents]=' +
          songId,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      console.log('Response data ', response.data.data);
      if (response.data.data && response.data.data.length > 0) {
        return {
          artist: response.data.data[0].attributes.artistName,
          title: response.data.data[0].attributes.name,
        };
      } else {
        throw new Error('Track not found');
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
    }
    return null;
  }
}
