/**
 * The pre-save hook on User hashes local-auth passwords. Mongoose 9 dropped
 * the `next` callback for async middleware, so this guards against the hook
 * silently not running (plaintext passwords) or rejecting saves.
 * No database: the collection's insertOne is stubbed.
 */

import bcrypt from 'bcryptjs';
import User from '../models/user';

describe('User password pre-save hook', () => {
  let insertOne: jest.SpyInstance;

  beforeEach(() => {
    insertOne = jest
      .spyOn(User.collection, 'insertOne')
      .mockResolvedValue({ acknowledged: true, insertedId: undefined as any });
  });

  afterEach(() => insertOne.mockRestore());

  it('hashes the password for local users', async () => {
    const user = new User({ email: 'a@example.com', name: 'A', authProvider: 'local', passwordHash: 'hunter22' });
    await user.save();

    expect(user.passwordHash).not.toBe('hunter22');
    expect(await bcrypt.compare('hunter22', user.passwordHash!)).toBe(true);
    expect(insertOne.mock.calls[0][0].passwordHash).toBe(user.passwordHash);
  });

  it('saves users without a password untouched', async () => {
    const user = new User({ email: 'g@example.com', name: 'G', authProvider: 'google' });
    await expect(user.save()).resolves.toBe(user);
    expect(user.passwordHash).toBeUndefined();
  });

  it('does not re-hash an unchanged password', async () => {
    const user = new User({ email: 'b@example.com', name: 'B', authProvider: 'local', passwordHash: 'pw-123456' });
    await user.save();
    const first = user.passwordHash;

    user.name = 'B2';
    jest.spyOn(User.collection, 'updateOne').mockResolvedValue({ acknowledged: true } as any);
    user.isNew = false;
    await user.save();
    expect(user.passwordHash).toBe(first);
  });
});
