import { IsArray, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Checkout Service' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['deposit', 'read'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsIn(['deposit', 'transfer', 'read'], { each: true })
  permissions: string[];

  @ApiProperty({ example: '1D', description: '1H, 1D, 1M, 1Y' })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
