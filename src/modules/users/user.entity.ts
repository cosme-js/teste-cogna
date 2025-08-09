
import { Task } from '@modules/task/task.entity';
import { Address } from '@modules/address/address.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    email: string;

    @Column({ nullable: false, select: false })
    password?: string;

    @OneToOne(() => Address)
    @JoinColumn({ name: 'address_id' })
    address?: Address

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role?: UserRole;

    @OneToMany(() => Task, task => task.user)
    tasks?: Task[];

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
