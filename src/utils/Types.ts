export const rebuildStrategies = ['dist-missing', 'always', 'ask'] as const;
export type RebuildStrategy = typeof rebuildStrategies[number];