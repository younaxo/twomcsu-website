/** Site username -> Minecraft skin username when they differ */
export const usernameAliases: Record<string, string> = {
  younaxo_: 'younaxo',
};

export function getMinecraftUsername(username: string): string {
  return usernameAliases[username] ?? username;
}
