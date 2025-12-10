import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateDepositDto {
  @ApiProperty({ example: 5000, description: 'Amount to deposit in Naira' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  amount: number;
}
