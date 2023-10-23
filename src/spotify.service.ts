import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SpotifyWebApi from 'spotify-web-api-node';

@Injectable()
export class SpotifyService {
  private spotifyApi: SpotifyWebApi;
  private tokenExpiresAt: number;
  private accessToken: string;

  constructor(private configService: ConfigService) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: this.configService.get<string>('SPOTIFY_CLIENT_ID'),
      clientSecret: this.configService.get<string>('SPOTIFY_CLIENT_SECRET'),
    });
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body['access_token'];
      const expiresIn = data.body['expires_in'];
      // Установите время истечения срока действия токена, учитывая небольшой запас времени (например, 10 секунд)
      this.tokenExpiresAt = Date.now() + (expiresIn - 10) * 1000;
    } catch (err) {
      console.log('Something went wrong when retrieving an access token', err);
      throw err;
    }
  }

  private async ensureAccessToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.refreshAccessToken();
    }
    this.spotifyApi.setAccessToken(this.accessToken);
  }

  async searchTrack(artist: string, title: string): Promise<string> {
    try {
      await this.ensureAccessToken();
    } catch (err) {
      console.log('Something went wrong when retrieving an access token', err);
    }

    const query = `artist:${artist} track:${title}`;
    try {
      const result = await this.spotifyApi.searchTracks(query);
      if (result && result.body.tracks && result.body.tracks.items.length > 0) {
        return result.body.tracks.items[0].external_urls.spotify;
      } else {
        throw new Error('Track not found');
      }
    } catch (err) {
      console.error('Error searching tracks:', err);
      throw err;
    }
  }

  async getTrackInfo(
    spotifyUrl: string,
  ): Promise<{ artist: string; title: string }> {
    try {
      await this.ensureAccessToken();
    } catch (err) {
      console.log('Something went wrong when retrieving an access token', err);
    }

    const trackId = this.extractTrackIdFromUrl(spotifyUrl);
    console.log('Track ID: ', trackId);

    const data = await this.spotifyApi.getTrack(trackId);
    console.log('Track Data: ', data);

    const artist = data.body.artists[0].name;
    const title = data.body.name;
    return { artist, title };
  }

  private extractTrackIdFromUrl(url: string): string {
    const match = url.match(/track\/([^/?]+)/);
    if (!match) {
      throw new Error('Invalid Spotify URL');
    }
    return match[1];
  }
}
