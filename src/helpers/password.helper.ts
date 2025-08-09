import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHelper {
    async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, process.env.SALT_PASSWORD ?? 10);
    }

    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}
