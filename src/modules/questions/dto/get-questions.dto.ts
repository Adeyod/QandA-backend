import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Plan } from 'src/modules/users/schemas/user.schema';

export class GetQuestionsDto {
  @ApiProperty({
    description: 'This is the plan that the user want the questions from',
    example: Plan.SECONDARY,
  })
  @IsEnum(Plan)
  plan: Plan;

  @ApiProperty({
    description: 'This is the subject name',
    example: 'chemistry',
  })
  @IsString({ message: 'Subject must be a string' })
  subject: string;

  @ApiProperty({
    description: 'This is the selected year',
    example: '2001',
  })
  @IsString({ message: 'Year must be a string' })
  year: string;
}
