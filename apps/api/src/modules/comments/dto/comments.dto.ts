import { CommentEmoji, COMMENT_EMOJIS, MAX_COMMENT_LENGTH } from '@twomc/shared';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMMENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_COMMENT_LENGTH)
  content!: string;
}

export class AddCommentReactionDto {
  @IsString()
  @IsIn(COMMENT_EMOJIS)
  emoji!: CommentEmoji;
}

export class ReportCommentDto {
  @IsString()
  @IsIn(['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'IMPERSONATION', 'OTHER'])
  reason!: 'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'IMPERSONATION' | 'OTHER';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ForceDisableCommentsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

export class ReviewCommentReportDto {
  @IsString()
  @IsIn(['RESOLVED', 'REJECTED'])
  status!: 'RESOLVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

export class ListCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'popular'])
  sort?: 'newest' | 'oldest' | 'popular';
}

export class DeleteCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
