import axios from 'axios';
import { load } from 'cheerio';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TitleService {
  private async getTitleFromURL(url: string): Promise<string | null> {
    return new Promise<string | null>(async (resolve) => {
      try {
        const response = await axios.get(url, { responseType: 'stream' });
        const chunks = [];
        let html = '';
        let title = '';

        response.data.on('data', async (chunk: any) => {
          chunks.push(chunk);
          html += chunk.toString('utf8');

          // Определите момент, когда вы получили достаточно данных для извлечения title
          // Например, вы можете проверить, что html содержит <title> и </title>
          if (html.includes('</title>')) {
            response.data.destroy(); // Останавливаем поток, чтобы не скачивать весь HTML
            const $ = load(html);
            title = $('title').text();
            console.log('Title:', title);
          }
          if (title) {
            resolve(title);
          }
        });

        response.data.on('end', () => {
          if (!title) {
            console.log('Title not found');
            resolve(null); // Решаем обещание с null, если заголовок не был найден
          }
        });
      } catch (error) {
        console.error('Error:', error);
        resolve(null); // Решаем обещание с null в случае ошибки
      }
    });
  }

  async getTrackInfo(
    link: string,
    from_platform: string,
  ): Promise<{ artist: string; title: string } | null> {
    const title = await this.getTitleFromURL(link);
    if (!title) {
      console.log('Title not found');
      return null;
    }

    switch (from_platform) {
      case 'youtube-video': {
        const claer_title = title.replace(' - YouTube', '');
        console.log('Clear title:', claer_title);
        const parts = claer_title.split(' - ');
        if (parts.length === 2) {
          const [artist, title] = parts.map((part) => part.trim());
          console.log('Artist:', artist, ', Title: ', title);
          if (artist && title) {
            return { artist, title };
          }
        }
        break;
      }
    }
    return null;
  }
}
