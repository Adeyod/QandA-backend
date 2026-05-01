import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TransactionType } from '../schemas/transaction.schema';

export class TransactionCreationDto {
  @ApiProperty({
    description: 'The wallet ID for the wallet to be credited',
    example: '45q9fak342d32284fak3841q',
  })
  @IsNotEmpty({ message: 'Wallet ID is required' })
  @IsString({ message: 'Wallet ID must be a string' })
  walletId!: string;

  @ApiProperty({
    description:
      'This is the amount that will be credited to the wallet account',
    example: 500,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'This is the narration of what the amount is meant for',
    example: 'Referral bonus',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description!: string;

  @ApiProperty({
    description: 'This is the transaction type for this particular transaction',
    example: TransactionType.CREDIT,
  })
  @IsNotEmpty({ message: 'Transaction type is required' })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;
}
