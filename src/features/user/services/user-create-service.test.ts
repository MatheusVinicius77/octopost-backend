import type { UserRepository } from '@/features/user/repositories/user-repository';
import { UserCreateService } from '@/features/user/services/user-create-service';
import { BcryptAdapter } from '@/shared/infra/crypto/bcrypt-adapter';

// TODO: Refactor
const makeSut = () => {
  class UserRepositoryStub implements UserRepository {
    create({ email, name, password, username }: any) {
      return Promise.resolve({
        createdAt: new Date(2024, 5, 1),
        deletedAt: null,
        email,
        id: 'valid_id',
        isActive: true,
        name,
        password,
        updatedAt: new Date(2024, 5, 1),
        username,
      });
    }

    findById(id: string): Promise<{
      email: string;
      id: string;
      name: null | string;
      username: string;
    } | null> {
      throw new Error('Method not implemented. ' + id);
    }
    updateIsActiveStatus(_: string): Promise<void> {
      throw new Error('Method not implemented.');
    }
  }

  const userRepository = new UserRepositoryStub();

  const bcryptAdapter = new BcryptAdapter();

  const userCreateService = new UserCreateService(
    userRepository,
    bcryptAdapter
  );

  return { bcryptAdapter, userCreateService, userRepository };
};

describe('UserCreateService', () => {
  it('should call userRepository with correct params', async () => {
    const { bcryptAdapter, userCreateService, userRepository } = makeSut();

    const repositorySpy = vi.spyOn(userRepository, 'create');

    vi.spyOn(bcryptAdapter, 'encrypt').mockImplementationOnce(
      async () => 'valid_password'
    );

    await userCreateService.execute({
      email: 'valid_email@email.com',
      name: 'valid_name',
      password: 'valid_password',
      repeatPassword: 'valid_password',
      username: 'valid_username',
    });

    expect(repositorySpy).toHaveBeenCalledWith({
      email: 'valid_email@email.com',
      name: 'valid_name',
      password: 'valid_password',
      username: 'valid_username',
    });
  });

  it('should throw when userRepository throws', async () => {
    const { userCreateService, userRepository } = makeSut();

    vi.spyOn(userRepository, 'create').mockImplementationOnce(async () => {
      throw new Error('error');
    });

    const response = userCreateService.execute({
      email: 'valid_email@email.com',
      name: 'valid_name',
      password: 'valid_password',
      repeatPassword: 'valid_password',
      username: 'valid_username',
    });

    await expect(response).rejects.toThrowError();
  });

  it('should conflict when password and repeatPassword dont match', async () => {
    const { userCreateService } = makeSut();

    const response = userCreateService.execute({
      email: 'valid_email@email.com',
      name: 'valid_name',
      password: 'valid_password',
      repeatPassword: 'invalid_password',
      username: 'valid_username',
    });

    await expect(response).rejects.toThrowError();
  });
});
