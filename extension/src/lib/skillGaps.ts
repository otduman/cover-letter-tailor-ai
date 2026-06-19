// Compare required skills against the master document (ported from
// skill_matcher.find_gaps). Simple case-insensitive substring match.
export function findGaps(requiredSkills: string[], masterDocText: string): string[] {
  if (!requiredSkills.length || !masterDocText) return [];
  const haystack = masterDocText.toLowerCase();
  return requiredSkills.filter((skill) => !haystack.includes(skill.toLowerCase()));
}
