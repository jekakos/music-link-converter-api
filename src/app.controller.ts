import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Redirect,
  Res,
} from '@nestjs/common';
import { SpotifyService } from './services/spotify.service.js';
import { YandexMusicService } from './services/yandex-music.service.js';
import { CommonService } from './services/common.service.js';
import { Response } from 'express';
import { YoutubeMusicService } from './services/youtube.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly commonService: CommonService,
    private readonly spotifyService: SpotifyService,
    private readonly yandexService: YandexMusicService,
    private readonly youtubeService: YoutubeMusicService,
  ) {}

  @Get('search_track')
  async getTrack(
    @Query('platform') platform: string,
    @Query('artist') artist: string,
    @Query('title') title: string,
  ): Promise<string | null> {
    if (!platform)
      throw new BadRequestException('Parameter platform must be defind');

    switch (platform) {
      case 'spotify': {
        return await this.spotifyService.searchTrack(artist, title);
      }
      case 'yandex-music': {
        return await this.yandexService.searchTrack(artist, title);
      }
      case 'youtube-music': {
        return await this.youtubeService.searchTrack(artist, title);
      }
    }
    throw new NotFoundException('Cannot find platform ' + platform);
  }

  @Get('get_link')
  async getLink(
    @Query('link') link: string,
    @Query('to_platform') to_platform: string,
  ): Promise<string | null> {
    if (!to_platform)
      throw new BadRequestException('Parameter platform must be defind');

    const from_platform = this.commonService.detectPlatform(link);
    let info: { artist: string; title: string } | null = {
      artist: '',
      title: '',
    };

    switch (from_platform) {
      case 'spotify':
        {
          info = await this.spotifyService.getTrackInfo(link);
        }
        break;
      case 'yandex-music':
        {
          info = await this.yandexService.getTrackInfo(link);
        }
        break;
      case 'youtube-music':
        {
          info = await this.youtubeService.getTrackInfo(link);
        }
        break;
    }

    if (!info || !info.artist || !info.title)
      throw new NotFoundException('Cannot find track info');

    switch (to_platform) {
      case 'spotify': {
        return await this.spotifyService.searchTrack(info.artist, info.title);
      }
      case 'yandex-music': {
        return await this.yandexService.searchTrack(info.artist, info.title);
      }
      case 'youtube-music': {
        return await this.youtubeService.searchTrack(info.artist, info.title);
      }
    }

    throw new NotFoundException('Cannot find platform ' + to_platform);
  }

  @Get('get_redirect_link')
  @Redirect()
  async getRedirectLink(
    @Query('link') link: string,
    @Query('to_platform') to_platform: string,
    @Res() res: Response,
  ): Promise<void> {
    let errorText = '';

    try {
      const newLink = await this.getLink(link, to_platform);
      if (newLink) {
        return res.redirect(newLink);
      } else {
        errorText = 'Not found';
      }
    } catch (error) {
      errorText = 'Search error, repeat again please';
    }

    // Если произошла ошибка или композиция не найдена
    const htmlResponse = `
        <html>
          <body>
            <h1>
             ${errorText}
            <h1>
          </body>
        </html>
      `;
    res.send(htmlResponse); // Отправка HTML-ответа с JavaScript-кодом
  }
}
