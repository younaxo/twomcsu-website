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
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromoValidationResult, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CartService } from './cart.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, ValidatePromoDto } from './dto/store.dto';
import { PromocodesService, PromoCodeAdminView } from './promocodes.service';

@Controller('store/promocodes')
export class PromocodesController {
  constructor(private readonly cart: CartService) {}

  @Post('validate')
  @UseGuards(OptionalJwtAuthGuard)
  validate(
    @Body() dto: ValidatePromoDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PromoValidationResult> {
    return this.cart.validatePromo(user?.id, dto.code);
  }
}

@Controller('admin/promocodes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminPromocodesController {
  constructor(private readonly promocodes: PromocodesService) {}

  @Get()
  list(@Query('search') search?: string): Promise<PromoCodeAdminView[]> {
    return this.promocodes.list(search);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePromoCodeDto): Promise<PromoCodeAdminView> {
    return this.promocodes.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ): Promise<PromoCodeAdminView> {
    return this.promocodes.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.promocodes.remove(id);
  }
}
