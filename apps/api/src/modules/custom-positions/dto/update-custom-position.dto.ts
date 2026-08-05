import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomPositionDto } from './create-custom-position.dto';

export class UpdateCustomPositionDto extends PartialType(CreateCustomPositionDto) {}
