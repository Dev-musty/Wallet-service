import { IsString, IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
    @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID of the expired key' })
  @IsUUID()
  expired_key_id: string;

  @ApiProperty({ example: '1M', description: '1H, 1D, 1M, 1Y' })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
