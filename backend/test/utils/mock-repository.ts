/**
 * Minimal TypeORM Repository mock for unit tests.
 * Every method is a jest.fn(); configure return values per test.
 */
export type MockRepository = {
  findOne: jest.Mock;
  find: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

export function createMockRepository(): MockRepository {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    // create() returns the plain object it was given, like TypeORM does.
    create: jest.fn((entity: unknown) => entity),
    // save() resolves to the entity with an id, like an insert would.
    save: jest.fn((entity: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...entity }),
    ),
    remove: jest.fn((entity: unknown) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn(),
  };
}

/** Casts a mock to the repository type a service constructor expects. */
export function asRepository<T>(mock: MockRepository): T {
  return mock as unknown as T;
}
