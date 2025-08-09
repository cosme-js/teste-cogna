import { NestFactory } from '@nestjs/core';
import { CreateAdminUserSeed } from '@infra/db/seeds/create-root-user.seed';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { SeedModule } from './seed.module';

async function bootstrap() {
    dotenv.config({ path: join(__dirname, '..', '.env') });

    const appContext = await NestFactory.create(SeedModule, { logger: false });
    const seedService = appContext.get(CreateAdminUserSeed);


    await seedService.runSeeds();

    await appContext.close();
    process.exit(0);
}

bootstrap();
