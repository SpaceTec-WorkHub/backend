import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('chat_history')
export class ChatHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  usuarioId!: string;

  @Column()
  role!: 'user' | 'model';

  @Column('text')
  message!: string;

  @CreateDateColumn()
  createdAt!: Date; 
}