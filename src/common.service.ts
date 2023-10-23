import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  detectPlatform(link: string): string {
    if (link.includes('spotify.com')) return 'spotify';
    if (link.includes('music.yandex')) return 'yandex-music';

    throw Error('Platform not detected');
  }
}
