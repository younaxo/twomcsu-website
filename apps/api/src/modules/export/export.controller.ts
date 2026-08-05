import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { RoleGroup } from '@twomc/shared';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExportFormat, ExportService } from './export.service';

class ExportFormatDto {
  @IsEnum(['csv', 'excel', 'pdf'] as const)
  format!: ExportFormat;
}

class ExportUsersDto extends ExportFormatDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  roleGroup?: string;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

class ExportOrdersDto extends ExportFormatDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

class ExportReportsDto extends ExportFormatDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

class ExportNewsDto extends ExportFormatDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

class ExportAuditDto extends ExportFormatDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('users/export')
  async exportUsers(@Body() dto: ExportUsersDto, @Res() res: Response) {
    const result = await this.exportService.exportUsers(
      {
        search: dto.search,
        roleGroup: dto.roleGroup,
        isBanned: dto.isBanned,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
        userIds: dto.userIds,
      },
      dto.format,
    );
    return sendExport(res, result);
  }

  @Post('orders/export')
  async exportOrders(@Body() dto: ExportOrdersDto, @Res() res: Response) {
    const result = await this.exportService.exportOrders(
      {
        status: dto.status,
        userId: dto.userId,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      },
      dto.format,
    );
    return sendExport(res, result);
  }

  @Post('reports/export')
  async exportReports(@Body() dto: ExportReportsDto, @Res() res: Response) {
    const result = await this.exportService.exportReports(
      {
        status: dto.status,
        type: dto.type,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      },
      dto.format,
    );
    return sendExport(res, result);
  }

  @Post('news/export')
  async exportNews(@Body() dto: ExportNewsDto, @Res() res: Response) {
    const result = await this.exportService.exportNews(
      {
        status: dto.status,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      },
      dto.format,
    );
    return sendExport(res, result);
  }

  @Post('audit-log/export')
  async exportAudit(@Body() dto: ExportAuditDto, @Res() res: Response) {
    const result = await this.exportService.exportAuditLog(
      {
        actorId: dto.actorId,
        action: dto.action,
        severity: dto.severity,
        search: dto.search,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      },
      dto.format,
    );
    return sendExport(res, result);
  }
}

function sendExport(
  res: Response,
  result: { buffer: Buffer; contentType: string; filename: string },
) {
  res.setHeader('Content-Type', result.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(result.filename)}"`,
  );
  return res.send(result.buffer);
}
