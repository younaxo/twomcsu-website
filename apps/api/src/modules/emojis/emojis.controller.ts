import { Controller, Get, Query } from '@nestjs/common';
import { CustomEmoji } from '@twomc/shared';
import { Public } from '../auth/decorators/public.decorator';
import { SearchEmojisDto } from './dto/search-emojis.dto';
import { EmojisService } from './emojis.service';

@Controller('emojis/custom')
export class EmojisController {
  constructor(private readonly emojis: EmojisService) {}

  @Get()
  @Public()
  list(): Promise<CustomEmoji[]> {
    return this.emojis.listActive();
  }

  @Get('search')
  @Public()
  search(@Query() query: SearchEmojisDto): Promise<CustomEmoji[]> {
    return this.emojis.search(query.q ?? '');
  }
}
