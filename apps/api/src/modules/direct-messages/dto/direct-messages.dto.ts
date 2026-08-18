import {
  COMMENT_EMOJIS,
  ConversationRole,
  DirectMessagePolicy,
  type CommentEmoji,
} from '@twomc/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDirectConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;
}

export class CreateGroupConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  usernames!: string[];
}

export class SendDirectMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class EditDirectMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class ReactToDirectMessageDto {
  @IsIn(COMMENT_EMOJIS)
  emoji!: CommentEmoji;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class AddConversationMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;
}

export class UpdateConversationMemberDto {
  @IsIn([ConversationRole.MODERATOR, ConversationRole.MEMBER])
  role!: 'MODERATOR' | 'MEMBER';
}

export class CreateGroupInviteDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxUses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 365)
  expiresInHours?: number;
}

export class UpdateDirectMessagePrivacyDto {
  @IsIn(Object.values(DirectMessagePolicy))
  policy!: DirectMessagePolicy;
}

export class MarkConversationReadDto {
  @IsOptional()
  @IsString()
  messageId?: string;
}

export class ConversationSocketDto {
  @IsString()
  conversationId!: string;
}
