import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private logger = morgan('dev'); // 'dev' format logs requests in a colorful way, you can customize it if needed

  use(req: Request, res: Response, next: NextFunction) {
    this.logger(req, res, next);
    //Logger.debug('Request: ' + JSON.stringify(req.body));
    ///Logger.debug('Headers: ' + JSON.stringify(req.headers));
  }
}
