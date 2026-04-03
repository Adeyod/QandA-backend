import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'This is the name on the bank account of the user.',
    example: 'John Doe',
  })
  @IsNotEmpty({ message: 'Account name is required.' })
  @IsString({ message: 'Account name must be a string' })
  accountName!: string;

  @ApiProperty({
    description: 'This is the account number of the user.',
    example: '2039483920',
  })
  @IsNotEmpty({ message: 'Account number is required.' })
  @IsString({ message: 'Account number must be a string' })
  accountNumber!: string;

  @ApiProperty({
    description:
      'This the name of the bank that the account number is domiciled.',
    example: 'Access Bank',
  })
  @IsNotEmpty({ message: 'Bank name is required.' })
  @IsString({ message: 'Bank name must be a string' })
  bankName!: string;
}
