import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';

export class SubjectResponseDto {
  @ApiProperty({
    description: 'Subject ID',
    example: 'ei3392ue8394jf9550dj49fj',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'Subject Name',
    example: 'Chemistry',
  })
  name!: string;

  @ApiProperty({
    description: 'Plan that the subject belong to',
    example: [PlanCode.SECONDARY, PlanCode.TERTIARY],
  })
  plans!: [PlanCode];
}
