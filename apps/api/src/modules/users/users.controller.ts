import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RoleGroup, UserProfile, UserSearchResult } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SearchUsersDto } from './dto/search-users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  search(@Query() query: SearchUsersDto): Promise<UserSearchResult[]> {
    return this.users.search(query.q);
  }

  @Get(':username/public')
  findPublic(@Param('username') username: string): Promise<UserProfile> {
    return this.users.findPublicProfile(username);
  }
}
