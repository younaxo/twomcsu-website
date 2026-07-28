import { ReactionType } from '@twomc/shared';
import { IsEnum, ValidateIf } from 'class-validator';

export class SetReactionDto {
  /** null clears the reaction */
  @ValidateIf((_, value) => value !== null)
  @IsEnum(ReactionType)
  type: ReactionType | null;
}
