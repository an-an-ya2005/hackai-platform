import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';
import { OAuthProfile } from './interfaces/auth.interface';
import * as bcrypt from 'bcryptjs';

describe('AuthService Google roles', () => {
  const adminEmail = 'organizer@example.com';
  const profile: OAuthProfile = {
    providerId: 'google-user-id',
    provider: 'google',
    email: adminEmail,
    name: 'Organizer User',
  };

  let databaseService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let authService: AuthService;

  beforeEach(() => {
    databaseService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    authService = new AuthService(
      {} as JwtService,
      databaseService as unknown as DatabaseService,
      { get: jest.fn().mockReturnValue(adminEmail) } as unknown as ConfigService,
    );
  });

  it('creates the configured Google account as an admin', async () => {
    databaseService.user.findUnique.mockResolvedValue(null);
    databaseService.user.create.mockImplementation(({ data }) => Promise.resolve({
      id: 'admin-id',
      ...data,
      role: data.role,
    }));

    const user = await authService.validateOAuthUser(profile);

    expect(databaseService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: adminEmail,
        role: UserRole.ADMIN,
      }),
    });
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('assigns other Google accounts the participant role', async () => {
    databaseService.user.findUnique.mockResolvedValue(null);
    databaseService.user.create.mockImplementation(({ data }) => Promise.resolve({
      id: 'participant-id',
      ...data,
      role: data.role,
    }));

    const user = await authService.validateOAuthUser({
      ...profile,
      email: 'participant@example.com',
    });

    expect(user.role).toBe(UserRole.PARTICIPANT);
    expect(databaseService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: UserRole.PARTICIPANT }),
    });
  });

  it('promotes an existing matching Google account when it signs in', async () => {
    databaseService.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      email: adminEmail,
      role: UserRole.PARTICIPANT,
      providerId: profile.providerId,
      firstName: null,
      lastName: null,
      avatar: null,
      name: profile.name,
    });
    databaseService.user.update.mockImplementation(({ data }) => Promise.resolve({
      id: 'admin-id',
      ...data,
      role: data.role,
    }));

    const user = await authService.validateOAuthUser(profile);

    expect(databaseService.user.update).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      data: expect.objectContaining({ role: UserRole.ADMIN, password: null }),
    });
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('keeps an existing non-admin Google account as a participant', async () => {
    databaseService.user.findUnique.mockResolvedValue({
      id: 'participant-id',
      email: 'participant@example.com',
      role: UserRole.ADMIN,
      providerId: 'participant-google-id',
      firstName: null,
      lastName: null,
      avatar: null,
      name: 'Participant User',
    });
    databaseService.user.update.mockImplementation(({ data }) => Promise.resolve({
      id: 'participant-id',
      ...data,
      role: data.role,
    }));

    const user = await authService.validateOAuthUser({
      ...profile,
      providerId: 'participant-google-id',
      email: 'participant@example.com',
    });

    expect(databaseService.user.update).toHaveBeenCalledWith({
      where: { id: 'participant-id' },
      data: expect.objectContaining({ role: UserRole.PARTICIPANT }),
    });
    expect(user.role).toBe(UserRole.PARTICIPANT);
  });

  it('matches the configured admin email without case sensitivity or surrounding spaces', async () => {
    databaseService.user.findUnique.mockResolvedValue(null);
    databaseService.user.create.mockImplementation(({ data }) => Promise.resolve({
      id: 'admin-id',
      ...data,
      role: data.role,
    }));

    await authService.validateOAuthUser({
      ...profile,
      email: '  ORGANIZER@EXAMPLE.COM ',
    });

    expect(databaseService.user.findUnique).toHaveBeenCalledWith({
      where: { email: adminEmail },
    });
    expect(databaseService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: adminEmail,
        role: UserRole.ADMIN,
      }),
    });
  });

  it('does not allow password registration to create Admin accounts', async () => {
    await expect(authService.register({
      email: adminEmail.toUpperCase(),
      password: 'secure-password',
      firstName: 'Organizer',
      lastName: 'User',
      role: UserRole.ADMIN,
    })).rejects.toThrow('Admin accounts must be created by signing in with the configured Google account');

    expect(databaseService.user.create).not.toHaveBeenCalled();
  });

  it('rejects Admin registration for any email other than ADMIN_EMAIL', async () => {
    await expect(authService.register({
      email: 'attacker@example.com',
      password: 'secure-password',
      firstName: 'Unauthorized',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    })).rejects.toThrow('Admin accounts must be created by signing in with the configured Google account');

    expect(databaseService.user.create).not.toHaveBeenCalled();
  });

  it('does not allow password login for the configured admin email', async () => {
    await expect(authService.loginWithPassword({
      email: adminEmail,
      password: 'any-password',
      role: UserRole.ADMIN,
    })).rejects.toThrow('Admin accounts must sign in with Google');

    expect(databaseService.user.findUnique).not.toHaveBeenCalled();
  });

  it('does not allow an existing Admin account to sign in through GitHub', async () => {
    databaseService.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      email: adminEmail,
      role: UserRole.ADMIN,
      providerId: 'google-user-id',
    });

    await expect(authService.validateOAuthUser({
      ...profile,
      provider: 'github',
      providerId: 'github-user-id',
    })).rejects.toThrow('Admin accounts must sign in with Google');

    expect(databaseService.user.update).not.toHaveBeenCalled();
  });

  it('rejects sign-in when the selected role does not match the account role', async () => {
    databaseService.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      email: 'participant@example.com',
      password: await bcrypt.hash('secure-password', 4),
      role: UserRole.ADMIN,
    });

    await expect(authService.loginWithPassword({
      email: 'participant@example.com',
      password: 'secure-password',
      role: UserRole.PARTICIPANT,
    })).rejects.toThrow('This account does not have the selected role');
  });
});
