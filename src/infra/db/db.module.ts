import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || 'admin',
            password: process.env.DB_PASSWORD || 'admin123',
            database: process.env.DB_DATABASE || 'meubanco',
            entities: [
                join(__dirname, '../../', `modules/**/*.entity.js`),
                join(__dirname, '../../', `modules/**/*.entity.ts`)
            ],
            synchronize: true,
        }),
    ],
})
export class DbModule { }
