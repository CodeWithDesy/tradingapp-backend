import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'dns';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter/all-exceptions.filter';

// Some networks advertise IPv6 DNS records that aren't actually routable —
// Node then tries the IPv6 address first and fails with ENETUNREACH before
// ever falling back to IPv4 (this is exactly what broke SMTP email sending
// on Gmail's IPv6 range). Forcing IPv4-first here fixes it process-wide, for
// any outbound connection, not just email.
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // tighten this to your real frontend origin before production

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();