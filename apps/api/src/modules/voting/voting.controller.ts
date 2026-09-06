import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateVoteSiteDto, UpdateVoteSiteDto, VoteWebhookDto } from './dto/voting.dto';
import { VotingService } from './voting.service';

@Controller('voting')
export class VotingController {
  constructor(private readonly voting: VotingService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  overview(@CurrentUser('id') userId?: string) {
    return this.voting.overview(userId);
  }

  @Post('webhook/:slug')
  processWebhook(
    @Param('slug') slug: string,
    @Headers('x-vote-secret') secret: string | undefined,
    @Body() dto: VoteWebhookDto,
  ) {
    return this.voting.processWebhook(slug, secret, dto);
  }
}

@Controller('admin/voting/sites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminVotingController {
  constructor(private readonly voting: VotingService) {}

  @Get()
  list() {
    return this.voting.adminList();
  }

  @Post()
  create(@Body() dto: CreateVoteSiteDto) {
    return this.voting.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVoteSiteDto) {
    return this.voting.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.voting.remove(id);
  }

  @Post(':id/rotate-secret')
  rotateSecret(@Param('id') id: string) {
    return this.voting.rotateSecret(id);
  }
}
