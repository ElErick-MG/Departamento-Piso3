export interface UserRef {
  id: number;
  name?: string;
}

export interface CleaningGroupResult {
  userIds: number[];
  groupSize: 2;
}

export type Rng = () => number;

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Regla base del negocio:
// - El grupo de la semana siguiente excluye a TODOS los usuarios de la semana previa.
// - El tamaño del grupo siempre es 2 para evitar el ciclo 2/3 actual.
export function generateNextCleaningGroup(
  users: UserRef[],
  lastGroupUserIds: number[] = [],
  rng: Rng = Math.random
): CleaningGroupResult {
  if (users.length < 2) {
    throw new Error('Se requieren al menos 2 usuarios para generar un grupo.');
  }

  const excluded = new Set(lastGroupUserIds);
  const eligible = users.map(user => user.id).filter(id => !excluded.has(id));

  if (eligible.length < 2) {
    throw new Error('No hay suficientes usuarios elegibles para esta semana.');
  }

  const groupSize: 2 = 2;
  const shuffled = shuffle(eligible, rng);

  return {
    userIds: shuffled.slice(0, groupSize),
    groupSize,
  };
}
