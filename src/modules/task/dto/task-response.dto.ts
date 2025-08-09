import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TaskResponseDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() status: string;
  @Expose() created_at: Date;
  @Expose() updated_at: Date;
  @Expose() due_date: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}
