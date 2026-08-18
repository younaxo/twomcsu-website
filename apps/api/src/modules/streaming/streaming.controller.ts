import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateStreamChannelDto, UpdateStreamChannelDto } from './dto/streaming.dto';
import { StreamingService } from './streaming.service';

@Controller('streams')
export class StreamingController {
  constructor(private readonly streaming: StreamingService) {}

  @Get()
  list() {
    return this.streaming.publicList();
  }
}

@Controller('admin/streams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminStreamingController {
  constructor(private readonly streaming: StreamingService) {}

  @Get()
  list() {
    return this.streaming.adminList();
  }

  @Post()
  create(@Body() dto: CreateStreamChannelDto) {
    return this.streaming.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStreamChannelDto) {
    return this.streaming.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.streaming.remove(id);
  }

  @Post('refresh')
  refresh() {
    return this.streaming.refresh();
  }
}
