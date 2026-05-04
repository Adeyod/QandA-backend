import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Plan } from '../../users/schemas/user.schema';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name',
    example: 'English',
  })
  @IsNotEmpty({ message: 'Subject name is required' })
  @IsString({ message: 'Subject name is a string' })
  name!: string;

  @ApiProperty({
    description: 'Plan that the subject belong to.',
    example: Plan.SECONDARY,
  })
  @IsNotEmpty({ message: 'Plan is required' })
  @IsString({ message: 'Plan is a string' })
  plan!: Plan;
}
