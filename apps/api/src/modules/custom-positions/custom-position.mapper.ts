import { CustomPosition as CustomPositionRow, Prisma } from '@prisma/client';
import { CustomPosition, UserCustomPositionView } from '@twomc/shared';

type UserCustomPositionWithPosition = Prisma.UserCustomPositionGetPayload<{
  include: {
    customPosition: {
      select: {
        id: true;
        name: true;
        slug: true;
        color: true;
        icon: true;
        description: true;
      };
    };
  };
}>;

export function toCustomPosition(row: CustomPositionRow): CustomPosition {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    icon: row.icon,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toUserCustomPositionView(row: UserCustomPositionWithPosition): UserCustomPositionView {
  return {
    id: row.customPosition.id,
    name: row.customPosition.name,
    slug: row.customPosition.slug,
    color: row.customPosition.color,
    icon: row.customPosition.icon,
    description: row.customPosition.description,
    assignedAt: row.assignedAt.toISOString(),
  };
}
