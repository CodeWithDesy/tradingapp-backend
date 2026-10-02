import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Wallet } from "src/banking/entities/wallet.entity";

export enum UserRole { USER = 'USER', ADMIN = 'ADMIN' }
export enum AccountStatus { ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED', DELETED = 'DELETED' }

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 120})
    fullName: string;

    @Column({unique: true})
    email: string;

    @Column({length: 30})
    phone: string;

    @Column({length: 120})
    country: string;

    @Column({length: 120})
    password: string;

    @Column({type: 'enum', enum: UserRole, default: UserRole.USER})
    role: UserRole;

    @Column({type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE})
    accountStatus: AccountStatus;

    @Column({default: false})
    emailVerified: boolean;

    @Column({nullable: true})
    avatar: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

   
}
