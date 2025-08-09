
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    neighborhood: string;

    @Column({ nullable: false })
    street: string;

    @Column({ nullable: false })
    city: string;

    @Column({ nullable: false })
    zip_code: string;

    @Column()
    region: string

}
