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
import { AppleMusicService } from './services/apple-music.service.js';
import { TitleService } from './services/title.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly commonService: CommonService,
    private readonly spotifyService: SpotifyService,
    private readonly yandexService: YandexMusicService,
    private readonly youtubeService: YoutubeMusicService,
    private readonly appleService: AppleMusicService,
    private readonly titleService: TitleService,
  ) {}

  @Get('search_track')
  async getTrack(
    @Query('to_platform') to_platform: string,
    @Query('artist') artist: string,
    @Query('title') title: string,
  ): Promise<string | null> {
    if (!to_platform)
      throw new BadRequestException('Parameter platform must be defind');

    artist = decodeURIComponent(artist);
    title = decodeURIComponent(title);
    let link;

    try {
      switch (to_platform) {
        case 'spotify':
          {
            link = await this.spotifyService.searchTrack(artist, title);
          }
          break;
        case 'yandex-music':
          {
            link = await this.yandexService.searchTrack(artist, title);
          }
          break;
        case 'youtube-music':
          {
            link = await this.youtubeService.searchTrack(artist, title);
          }
          break;
        case 'apple-music':
          {
            link = await this.appleService.searchTrack(artist, title);
          }
          break;
        default:
          throw new NotFoundException(
            `Platform "${to_platform}" is not supported.`,
          );
      }
    } catch (error) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Cannot find track on ${to_platform}`,
        error: 'Not Found',
        platform: to_platform,
        artist: artist,
        title: title,
      });
    }
    return link;
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
      case 'apple-music':
        {
          info = await this.appleService.getTrackInfo(link);
        }
        break;
      case 'youtube-video':
        {
          info = await this.titleService.getTrackInfo(link, from_platform);
        }
        break;
    }

    if (!info || !info.artist || !info.title)
      throw new NotFoundException('Cannot find track info');

    try {
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
        case 'apple-music': {
          return await this.appleService.searchTrack(info.artist, info.title);
        }
      }
    } catch (error) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Cannot find track on ${to_platform}`,
        error: 'Not Found',
        platform: to_platform,
        artist: info.artist,
        title: info.title,
      });
    }
    return null;
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
