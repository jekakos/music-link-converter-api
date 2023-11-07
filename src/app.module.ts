import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';

import { SpotifyService } from './services/spotify.service.js';
import { YandexMusicService } from './services/yandex-music.service.js';
import { CommonService } from './services/common.service.js';
import { YoutubeMusicService } from './services/youtube.service.js';
import { RequestLoggingMiddleware } from './logger/request-logging.middleware.js';
import { AppleMusicService } from './services/apple-music.service.js';
import { TitleService } from './services/title.service.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [
    CommonService,
    SpotifyService,
    YandexMusicService,
    YoutubeMusicService,
    AppleMusicService,
    TitleService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    //consumer
    //  .apply(AuthApiMiddleware)
    //  .exclude({ method: RequestMethod.GET, path: '/auth/token' })
    //  .forRoutes('*');
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
