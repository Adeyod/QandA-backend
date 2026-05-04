import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Plan } from '../../users/schemas/user.schema';

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
    example: [Plan.SECONDARY, Plan.TERTIARY],
  })
  plans!: [string];
}
