import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
// import bodyParser from 'body-parser';
import * as exegesisExpress from 'exegesis-express';

import {
  corsMiddleware,
  errorHandler,
  BearerAuthenticator,
} from './middlewares';

const createApp = async (): Promise<Application> => {
  const app = express();

  // secure apps by setting various HTTP headers
  app.use(helmet());

  // enable CORS - Cross Origin Resource Sharing
  app.options('*', corsMiddleware);
  app.use(corsMiddleware);
  // app.use(oauthMiddleware(type));

  const exegesisMiddleware = await exegesisExpress.middleware(
    path.resolve(__dirname, `./openapi/api/index.yml`),
    {
      controllers: path.resolve(__dirname, `./controllers/api`),
      controllersPattern: '**/*.@(ts|js)',
      authenticators: {
        bearerAuth: BearerAuthenticator,
      },
      // TODO: enable it once have time to update the api doc
      // onResponseValidationError: ({ errors, context }) => {
      //   const { res, isResponseFinished } = context;
      //   console.log(errors);
      //   console.log(res);
      //   if (isResponseFinished()) {
      //     return;
      //   }
      //   console.log(errors);
      //   res.status(400).json(errors);
      // },
    },
  );

  app.use(exegesisMiddleware);
  app.use(errorHandler);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next();
      return;
    }
    res.status(404).json({ message: 'Not found' });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).json({ message: `Internal error: ${err.message}` });
  });

  // app.use(bodyParser.json({ limit: config.get('server.bodyLimit'), strict: false }));

  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));

  return app;
};

export { createApp };
