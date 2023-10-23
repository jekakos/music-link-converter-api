import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { YandexMusicService } from './yandex-music.service';
import { CommonService } from './common.service';

@Controller()
export class AppController {
  constructor(
    private readonly commonService: CommonService,
    private readonly spotifyService: SpotifyService,
    private readonly yandexService: YandexMusicService,
  ) {}

  @Get('search_track')
  async getTrack(
    @Query('platform') platform: string,
    @Query('artist') artist: string,
    @Query('title') title: string,
  ): Promise<string> {
    if (!platform)
      throw new BadRequestException('Parameter platform must be defind');

    switch (platform) {
      case 'spotify': {
        return await this.spotifyService.searchTrack(artist, title);
      }
      case 'yandex-music': {
        return await this.yandexService.searchTrack(artist, title);
      }
    }
    throw new NotFoundException('Cannot find platform ' + platform);
  }

  @Get('get_link')
  async getLink(
    @Query('link') link: string,
    @Query('to_platform') to_platform: string,
  ): Promise<string> {
    if (!to_platform)
      throw new BadRequestException('Parameter platform must be defind');

    const from_platform = this.commonService.detectPlatform(link);
    let info: { artist: string; title: string } = {
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
    }

    if (!info.artist || !info.title)
      throw new NotFoundException('Cannot find track info');

    switch (to_platform) {
      case 'spotify': {
        return await this.spotifyService.searchTrack(info.artist, info.title);
      }
      case 'yandex-music': {
        return await this.yandexService.searchTrack(info.artist, info.title);
      }
    }

    throw new NotFoundException('Cannot find platform ' + to_platform);
  }
}
