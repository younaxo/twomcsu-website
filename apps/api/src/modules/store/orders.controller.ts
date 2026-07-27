import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateOrderResponse,
  OrderStatus,
  OrdersResponse,
  RoleGroup,
  StoreOrder,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CancelOrderDto, CreateOrderDto, RefundOrderDto } from './dto/store.dto';
import { OrdersService } from './orders.service';

@Controller('store/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    return this.orders.createFromCart(userId, dto.promoCode);
  }

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<OrdersResponse> {
    return this.orders.listMine(userId, page, limit);
  }

  @Get(':orderNumber')
  getByNumber(
    @CurrentUser('id') userId: string,
    @Param('orderNumber') orderNumber: string,
  ): Promise<StoreOrder> {
    return this.orders.getByOrderNumber(userId, orderNumber);
  }

  @Post(':orderId/mock-complete')
  mockComplete(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string,
  ): Promise<StoreOrder> {
    return this.orders.mockComplete(userId, orderId);
  }
}

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ): Promise<OrdersResponse> {
    return this.orders.listAdmin(page, limit, status, search);
  }

  @Get('stats')
  stats() {
    return this.orders.stats();
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<StoreOrder> {
    return this.orders.cancel(id, dto.reason);
  }

  @Patch(':id/refund')
  refund(
    @Param('id') id: string,
    @Body() dto: RefundOrderDto,
  ): Promise<StoreOrder> {
    return this.orders.refund(id, dto.reason);
  }
}
