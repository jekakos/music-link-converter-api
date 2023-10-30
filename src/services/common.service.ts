import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  detectPlatform(link: string): string {
    if (link.includes('spotify.com')) return 'spotify';
    if (link.includes('music.yandex')) return 'yandex-music';
    if (link.includes('music.youtube')) return 'youtube-music';
    if (link.includes('music.apple.com')) return 'apple-music';

    throw Error('Platform not detected');
  }
}
