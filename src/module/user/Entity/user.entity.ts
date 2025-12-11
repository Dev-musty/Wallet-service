import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  googleID: string;

  @Column({ default: () => 'NOW()' })
  createdAT: Date;

  @Column({ nullable: true })
  refreshToken: string;
}
