import { User } from 'src/users/entities/user.entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  // SHA-256 hex digest of the raw token — deterministic (unlike bcrypt), so
  // it can be looked up directly with a WHERE clause. This is fine for
  // refresh tokens specifically: unlike passwords, a refresh token is
  // already a long, random, high-entropy value with nothing for an
  // attacker to brute-force offline, so it doesn't need bcrypt's slow,
  // salted hashing — it needs a hash that's searchable.
  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}