import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name',
    example: 'English',
  })
  @IsNotEmpty({ message: 'Subject name is required' })
  @IsString({ message: 'Subject name is a string' })
  name: string;
}
