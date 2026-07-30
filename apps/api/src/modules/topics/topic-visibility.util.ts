import { RoleGroup, TopicVisibility, hasRoleGroup } from '@twomc/shared';
import { TopicVisibility as PrismaTopicVisibility } from '@prisma/client';

export type VisibilityRequirement = RoleGroup | 'AUTHENTICATED' | null;

export function visibilityMinRole(visibility: TopicVisibility | PrismaTopicVisibility): VisibilityRequirement {
  switch (visibility) {
    case TopicVisibility.PUBLIC:
      return null;
    case TopicVisibility.AUTHENTICATED:
      return 'AUTHENTICATED';
    case TopicVisibility.HELPER_ONLY:
      return RoleGroup.HELPER;
    case TopicVisibility.MODERATOR_ONLY:
      return RoleGroup.MODERATOR;
    case TopicVisibility.ADMIN_ONLY:
      return RoleGroup.ADMIN;
    case TopicVisibility.OWNER_ONLY:
      return RoleGroup.OWNER;
    default:
      return null;
  }
}

export function canViewTopic(
  visibility: TopicVisibility | PrismaTopicVisibility,
  viewerRole: RoleGroup | null,
): boolean {
  const min = visibilityMinRole(visibility);

  if (min === null) {
    return true;
  }

  if (min === 'AUTHENTICATED') {
    return viewerRole !== null;
  }

  if (viewerRole === null) {
    return false;
  }

  return hasRoleGroup(viewerRole, min);
}

export function allowedVisibilities(viewerRole: RoleGroup | null): PrismaTopicVisibility[] {
  return (Object.values(TopicVisibility) as PrismaTopicVisibility[]).filter((visibility) =>
    canViewTopic(visibility, viewerRole),
  );
}
