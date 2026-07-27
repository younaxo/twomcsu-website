import { Position as PositionRow } from '@prisma/client';
import { Position } from '@twomc/shared';

type PositionLike = Pick<
  PositionRow,
  | 'id'
  | 'name'
  | 'slug'
  | 'displayName'
  | 'group'
  | 'color'
  | 'backgroundColor'
  | 'icon'
  | 'priority'
>;

/** Strips the fields only the admin panel cares about */
export function toPublicPosition(position: PositionLike): Position {
  return {
    id: position.id,
    name: position.name,
    slug: position.slug,
    displayName: position.displayName,
    group: position.group,
    color: position.color,
    backgroundColor: position.backgroundColor,
    icon: position.icon,
    priority: position.priority,
  };
}
