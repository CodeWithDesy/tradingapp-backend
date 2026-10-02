import { User } from 'src/users/entities/user.entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

export enum SupportSender {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// One continuous thread per conversation (not a multi-ticket system) —
// either `user` (a registered customer) or `guestId` (an unregistered
// visitor, or a suspended user who can no longer log in) identifies whose
// conversation this message belongs to, regardless of who sent it; exactly
// one of the two is ever set, never both. `sender` says which side sent it
// — an admin's reply still identifies the customer/guest side, not the
// admin's own identity.
@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  user: User | null;

  // A random, unguessable token the frontend generates and stores in the
  // visitor's own browser (localStorage) so the same guest can return to
  // the same conversation across visits, without ever needing an account.
  // type is given explicitly rather than inferred — for a `string | null`
  // property, TypeScript's emitted design:type metadata can come through
  // as plain Object instead of String depending on the TS/TypeORM version
  // and tsconfig in use, which TypeORM then can't map to a MySQL type at
  // all without this.
  @Column({ type: 'varchar', nullable: true })
  guestId: string | null;

  // Optional, so admin has something to call them other than a raw token —
  // set the first time a guest provides it, kept thereafter. Same explicit
  // type reasoning as guestId above.
  @Column({ type: 'varchar', nullable: true })
  guestName: string | null;

  @Column({ type: 'enum', enum: SupportSender })
  sender: SupportSender;

  @Column('text')
  content: string;

  // Whether the OTHER side has seen this message — a USER/guest-sent
  // message is unread until an admin opens that conversation; an
  // ADMIN-sent message is unread until the customer/guest opens their own
  // support view.
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}