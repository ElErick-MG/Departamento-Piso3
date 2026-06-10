import { describe, it, expect } from 'vitest';
import { generateNextCleaningGroup } from '../lib/cleaningGroups';

const users = [
  { id: 1, name: 'Erick' },
  { id: 2, name: 'Karla' },
  { id: 3, name: 'David' },
  { id: 4, name: 'Jhon' },
  { id: 5, name: 'Gaby' },
];

function createRng(values: number[]) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

describe('generateNextCleaningGroup', () => {
  it('genera un grupo de 2 cuando no hay grupo previo', () => {
    const rng = createRng([0.1, 0.7, 0.4]);
    const result = generateNextCleaningGroup(users, [], rng);
    expect(result.groupSize).toBe(2);
    expect(result.userIds).toHaveLength(2);
  });

  it('excluye a todos los usuarios de la semana anterior', () => {
    const rng = createRng([0.2, 0.8, 0.6]);
    const lastGroup = [1, 2];
    const result = generateNextCleaningGroup(users, lastGroup, rng);

    expect(result.groupSize).toBe(2);
    expect(result.userIds).toHaveLength(2);
    result.userIds.forEach(id => expect(lastGroup).not.toContain(id));
  });

  it('mantiene grupo de 2 aunque la semana anterior haya tenido 3 personas', () => {
    const rng = createRng([0.3, 0.5]);
    const lastGroup = [1, 2, 3];
    const result = generateNextCleaningGroup(users, lastGroup, rng);

    expect(result.groupSize).toBe(2);
    expect(result.userIds).toHaveLength(2);
    result.userIds.forEach(id => expect(lastGroup).not.toContain(id));
  });

  it('respeta la exclusión de la semana anterior en cadena', () => {
    const rng = createRng([0.1, 0.9, 0.4, 0.7]);
    const first = generateNextCleaningGroup(users, [], rng);
    const second = generateNextCleaningGroup(users, first.userIds, rng);
    const third = generateNextCleaningGroup(users, second.userIds, rng);

    expect(first.groupSize).toBe(2);
    expect(second.groupSize).toBe(2);
    expect(third.groupSize).toBe(2);

    second.userIds.forEach(id => expect(first.userIds).not.toContain(id));
    third.userIds.forEach(id => expect(second.userIds).not.toContain(id));
  });
});
