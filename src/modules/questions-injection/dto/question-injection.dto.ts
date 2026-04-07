import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ExamSection } from '../../questions/schemas/question.schema';

export enum ExamType {
  waec = 'waec',
  neco = 'neco',
  gce = 'gce',
  utme = 'utme',
}

export enum QuestionType {
  MCQ = 'mcq',
  ESSAY = 'essay',
  THEORY = 'theory',
}

export class QuestionObjDto {
  @ApiProperty({
    description:
      'This is the ID coming from the third party API or other sources.',
    example: 'eng-2000-1',
  })
  @IsNotEmpty({ message: 'ID is required.' })
  @IsString({ message: 'ID is a string' })
  id!: string;

  @ApiProperty({
    description: 'This is the question.',
    example: 'define noun',
  })
  @IsNotEmpty({ message: 'Question is required.' })
  @IsString({ message: 'Question is a string' })
  question!: string;

  @ApiProperty({
    description: 'This is the options to the question.',
    example: {
      a: 'Noun is the name of any person, animal, place or things.',
      b: 'Noun is the name of any person, animal, place or things.',
      c: 'Noun is the name of any person, animal, place or things.',
      d: 'Noun is the name of any person, animal, place or things.',
    },
  })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (!value) return value;

    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key.toLowerCase(), val]),
    );
  })
  options!: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };

  @ApiProperty({
    description: 'This is the answer.',
  })
  @IsOptional()
  @IsString({ message: 'Answer is a string' })
  answer?: string;

  @IsOptional()
  @IsString()
  passage?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiProperty({
    description: 'Explanation to the answer.',
  })
  @IsString({ message: 'Question is a string' })
  explanation?: string;

  @ApiProperty({
    description: 'Difficulty level of the question.',
  })
  @IsOptional()
  @IsString({ message: 'Difficulty is a string' })
  difficulty?: string;

  @ApiProperty({
    description: 'Explanation to the answer.',
  })
  @IsOptional()
  @IsString({ message: 'Topic is a string' })
  topic?: string;
}

export class QuestionInjectionDto {
  @ApiProperty({
    description: 'This is the exam year.',
    example: '2000',
  })
  @IsNotEmpty({ message: 'Year is required' })
  @IsString({ message: 'Year is a string' })
  year!: string;

  @ApiProperty({
    description: 'This is the type of exam.',
    example: ExamType.waec,
  })
  @IsNotEmpty({ message: 'Exam type is required' })
  @IsString({ message: 'Exam type is a string' })
  examType!: ExamType;

  @ApiProperty({
    description: 'This is the subject name.',
    example: 'physics',
  })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject is a string' })
  subject!: string;

  @ApiProperty({
    description: 'This is the section that the exam belong to.',
    example: 'objective',
  })
  @IsString({ message: 'Section is a string' })
  section!: ExamSection;

  @ApiProperty({
    description:
      'This is the type that the questions belong to. it can be any of these: mcq, essay or theory',
    example: 'mcq',
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({
    description: 'This is the question array.',
    example: [
      {
        id: 'eng-2000-1',
        question:
          'Choose the option nearest in meaning to the word underlined: The man was very frugal.',
        options: { A: 'stingy', B: 'generous', C: 'careless', D: 'wasteful' },
        answer: 'A',
        explanation: 'Frugal means economical or stingy.',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionObjDto)
  questions!: QuestionObjDto[];
}
