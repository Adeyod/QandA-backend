import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @IsNumber()
  @Min(10000) // ₦1 minimum (1000000 kobo)
  amount!: number;

  @IsNotEmpty()
  walletId!: string;
}
