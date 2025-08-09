
import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class AddressStorage {

    @PrimaryColumn()
    zip_code: string;

    @Column({ nullable: true })
    neighborhood: string;

    @Column({ nullable: false })
    street: string;

    @Column({ nullable: false })
    city: string;

    @Column()
    region: string

}
