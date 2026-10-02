import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : (rawMessage as { message?: unknown }).message || rawMessage;

    // HttpExceptions are expected, handled control flow (404s, validation
    // errors, etc.) — not worth logging as errors. Anything else is a genuine
    // bug: log the REAL message and stack trace, since the client only ever
    // gets the generic "Internal server error" above and this was previously
    // the only place that information existed at all.
    if (!(exception instanceof HttpException)) {
      const err = exception as Error;
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${err?.message}`,
        err?.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}