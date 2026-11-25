import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { StudentsService } from './students.service';
import { UserRole } from '../users/entities/user.entity';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('StudentsService', () => {
  let users: MockRepository;
  let service: StudentsService;

  beforeEach(() => {
    users = createMockRepository();
    service = new StudentsService(asRepository(users));
    users.count.mockResolvedValue(0);
  });

  describe('create', () => {
    it('creates a verified student account that can log in', async () => {
      const result = await service.create({
        name: '  Asha  ',
        email: '  Asha@Example.COM ',
        password: 'Temp@1234',
      });

      const saved = users.save.mock.calls[0][0];
      expect(saved).toMatchObject({
        name: 'Asha',
        email: 'asha@example.com',
        role: UserRole.STUDENT,
        isEmailVerified: true,
      });
      expect(saved.password).not.toBe('Temp@1234');
      await expect(bcrypt.compare('Temp@1234', saved.password)).resolves.toBe(
        true,
      );

      // The password hash never leaves the service.
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('asha@example.com');
    });

    it('rejects an email already used by any account', async () => {
      users.count.mockResolvedValue(1);

      await expect(
        service.create({
          name: 'Asha',
          email: 'admin@example.com',
          password: 'Temp@1234',
        }),
      ).rejects.toThrow(ConflictException);
      expect(users.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lists only students and caps the page size', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            [{ id: 2, name: 'A', email: 'a@x.com', password: 'hash' }],
            1,
          ]),
      };
      users.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, 5000, ' a ');

      expect(qb.where).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.STUDENT,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
        search: '%a%',
      });
      expect(qb.take).toHaveBeenCalledWith(100);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });

  describe('update / remove', () => {
    it('never touches admin accounts', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.update(1, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(users.findOne).toHaveBeenCalledWith({
        where: { id: 1, role: UserRole.STUDENT },
      });
      expect(users.remove).not.toHaveBeenCalled();
    });

    it('rejects changing email to one that is taken', async () => {
      users.findOne.mockResolvedValue({ id: 3, email: 'old@x.com' });
      users.count.mockResolvedValue(1);

      await expect(
        service.update(3, { email: 'Taken@X.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows saving the same email in a different case', async () => {
      users.findOne.mockResolvedValue({ id: 3, name: 'A', email: 'a@x.com' });

      await service.update(3, { email: 'A@X.com', name: ' B ' });

      expect(users.count).not.toHaveBeenCalled();
      expect(users.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@x.com', name: 'B' }),
      );
    });
  });
});
