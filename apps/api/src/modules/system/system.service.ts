import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SYSTEM_MODULES = [
  'store',
  'chat',
  'friends',
  'comments',
  'reports',
  'wiki',
  'tickets',
  'marketplace',
  'forum',
] as const;

export type SystemModuleKey = (typeof SYSTEM_MODULES)[number];

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureDefaults();
    } catch (error) {
      // Tables may be missing until migrate deploy — don't crash the process
      console.error('[SystemService] ensureDefaults failed:', error);
    }
  }

  private async ensureDefaults() {
    const existing = await this.prisma.maintenanceMode.findFirst();
    if (!existing) {
      await this.prisma.maintenanceMode.create({ data: {} });
    }

    for (const module of SYSTEM_MODULES) {
      await this.prisma.moduleStatus.upsert({
        where: { module },
        create: { module, isEnabled: true },
        update: {},
      });
    }
  }

  async getPublicStatus() {
    const [maintenance, modules, announcements] = await Promise.all([
      this.getMaintenanceRow(),
      this.listModules(),
      this.listActiveAnnouncements(),
    ]);

    return {
      maintenance: {
        isEnabled: maintenance.isEnabled,
        title: maintenance.title,
        message: maintenance.message,
        estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
      },
      disabledModules: modules
        .filter((m) => !m.isEnabled)
        .map((m) => ({ module: m.module, reason: m.reason })),
      announcements,
    };
  }

  async getMaintenanceRow() {
    try {
      let row = await this.prisma.maintenanceMode.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      if (!row) {
        row = await this.prisma.maintenanceMode.create({ data: {} });
      }
      return row;
    } catch {
      // Migration not applied yet
      return {
        id: 'pending',
        isEnabled: false,
        title: 'Технические работы',
        message: 'Сайт временно недоступен. Работы ведутся, скоро всё заработает!',
        estimatedEnd: null,
        enabledBy: null,
        enabledAt: null,
        updatedAt: new Date(),
      };
    }
  }

  async listModules() {
    try {
      const rows = await this.prisma.moduleStatus.findMany({
        orderBy: { module: 'asc' },
      });
      return rows.map((r) => ({
        id: r.id,
        module: r.module,
        isEnabled: r.isEnabled,
        reason: r.reason,
        disabledBy: r.disabledBy,
        disabledAt: r.disabledAt?.toISOString() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch {
      return SYSTEM_MODULES.map((module) => ({
        id: module,
        module,
        isEnabled: true,
        reason: null,
        disabledBy: null,
        disabledAt: null,
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  async listActiveAnnouncements(roleGroup?: string | null) {
    try {
      const now = new Date();
      const rows = await this.prisma.announcement.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ showFrom: null }, { showFrom: { lte: now } }] },
            { OR: [{ showUntil: null }, { showUntil: { gte: now } }] },
          ],
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });

      return rows
        .filter((r) => !r.targetRole || !roleGroup || r.targetRole === roleGroup)
        .map((r) => this.mapAnnouncement(r));
    } catch {
      return [];
    }
  }

  async getMaintenanceStatus() {
    const row = await this.getMaintenanceRow();
    return {
      id: row.id,
      isEnabled: row.isEnabled,
      title: row.title,
      message: row.message,
      estimatedEnd: row.estimatedEnd?.toISOString() ?? null,
      enabledBy: row.enabledBy,
      enabledAt: row.enabledAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async enableMaintenance(
    userId: string,
    data: { title?: string; message?: string; estimatedEnd?: string | null },
  ) {
    const row = await this.getMaintenanceRow();
    const updated = await this.prisma.maintenanceMode.update({
      where: { id: row.id },
      data: {
        isEnabled: true,
        title: data.title ?? row.title,
        message: data.message ?? row.message,
        estimatedEnd:
          data.estimatedEnd === undefined
            ? row.estimatedEnd
            : data.estimatedEnd
              ? new Date(data.estimatedEnd)
              : null,
        enabledBy: userId,
        enabledAt: new Date(),
      },
    });
    return this.mapMaintenance(updated);
  }

  async disableMaintenance() {
    const row = await this.getMaintenanceRow();
    const updated = await this.prisma.maintenanceMode.update({
      where: { id: row.id },
      data: {
        isEnabled: false,
        enabledBy: null,
        enabledAt: null,
        estimatedEnd: null,
      },
    });
    return this.mapMaintenance(updated);
  }

  async updateModule(
    module: string,
    data: { isEnabled: boolean; reason?: string | null },
    userId: string,
  ) {
    const existing = await this.prisma.moduleStatus.findUnique({ where: { module } });
    if (!existing) {
      throw new NotFoundException('Модуль не найден');
    }

    const updated = await this.prisma.moduleStatus.update({
      where: { module },
      data: {
        isEnabled: data.isEnabled,
        reason: data.isEnabled ? null : (data.reason ?? existing.reason),
        disabledBy: data.isEnabled ? null : userId,
        disabledAt: data.isEnabled ? null : new Date(),
      },
    });

    return {
      id: updated.id,
      module: updated.module,
      isEnabled: updated.isEnabled,
      reason: updated.reason,
      disabledBy: updated.disabledBy,
      disabledAt: updated.disabledAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async listAllAnnouncements() {
    const rows = await this.prisma.announcement.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => this.mapAnnouncement(r));
  }

  async createAnnouncement(
    data: {
      title: string;
      message: string;
      type?: string;
      link?: string | null;
      isActive?: boolean;
      isDismissible?: boolean;
      showFrom?: string | null;
      showUntil?: string | null;
      targetRole?: string | null;
      order?: number;
    },
    createdBy: string,
  ) {
    const row = await this.prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
        link: data.link ?? null,
        isActive: data.isActive ?? true,
        isDismissible: data.isDismissible ?? true,
        showFrom: data.showFrom ? new Date(data.showFrom) : null,
        showUntil: data.showUntil ? new Date(data.showUntil) : null,
        targetRole: data.targetRole ?? null,
        order: data.order ?? 0,
        createdBy,
      },
    });
    return this.mapAnnouncement(row);
  }

  async updateAnnouncement(
    id: string,
    data: Partial<{
      title: string;
      message: string;
      type: string;
      link: string | null;
      isActive: boolean;
      isDismissible: boolean;
      showFrom: string | null;
      showUntil: string | null;
      targetRole: string | null;
      order: number;
    }>,
  ) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Объявление не найдено');
    }

    const row = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.message !== undefined ? { message: data.message } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.link !== undefined ? { link: data.link } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isDismissible !== undefined ? { isDismissible: data.isDismissible } : {}),
        ...(data.showFrom !== undefined
          ? { showFrom: data.showFrom ? new Date(data.showFrom) : null }
          : {}),
        ...(data.showUntil !== undefined
          ? { showUntil: data.showUntil ? new Date(data.showUntil) : null }
          : {}),
        ...(data.targetRole !== undefined ? { targetRole: data.targetRole } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
    });
    return this.mapAnnouncement(row);
  }

  async deleteAnnouncement(id: string) {
    await this.prisma.announcement.delete({ where: { id } });
  }

  private mapMaintenance(row: {
    id: string;
    isEnabled: boolean;
    title: string;
    message: string;
    estimatedEnd: Date | null;
    enabledBy: string | null;
    enabledAt: Date | null;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      isEnabled: row.isEnabled,
      title: row.title,
      message: row.message,
      estimatedEnd: row.estimatedEnd?.toISOString() ?? null,
      enabledBy: row.enabledBy,
      enabledAt: row.enabledAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapAnnouncement(row: {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isActive: boolean;
    isDismissible: boolean;
    showFrom: Date | null;
    showUntil: Date | null;
    targetRole: string | null;
    order: number;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      link: row.link,
      isActive: row.isActive,
      isDismissible: row.isDismissible,
      showFrom: row.showFrom?.toISOString() ?? null,
      showUntil: row.showUntil?.toISOString() ?? null,
      targetRole: row.targetRole,
      order: row.order,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
