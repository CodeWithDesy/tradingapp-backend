import { User } from 'src/users/entities/user.entity/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';


// Append-only by convention — nothing in this codebase ever updates or
// deletes a row here, only creates them.
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  admin: User;

  @Column()
  action: string;

  @Column()
  targetType: string;

  @Column()
  targetId: number;

  @Column('text')
  details: string;

  @CreateDateColumn()
  createdAt: Date;
}