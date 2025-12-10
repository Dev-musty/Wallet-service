import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(1)
  amount: number;
}
