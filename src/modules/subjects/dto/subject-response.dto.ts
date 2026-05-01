import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

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
}
