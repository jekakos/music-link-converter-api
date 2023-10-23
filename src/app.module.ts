import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SpotifyService } from './spotify.service';
import { ConfigModule } from '@nestjs/config';
import { YandexMusicService } from './yandex-music.service';
import { CommonService } from './common.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [CommonService, SpotifyService, YandexMusicService],
})
export class AppModule {}
