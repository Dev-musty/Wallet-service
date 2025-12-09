import { IsNumber, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({ example: 1, description: 'ID of the expired key' })
  @IsNumber()
  expired_key_id: number;

  @ApiProperty({ example: '1M', description: '1H, 1D, 1M, 1Y' })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
