import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { authenticateUser, INITIAL_OWNER, migrateUsers, readUsers, registerUser, USERS_KEY } from './authService.js'

const storage = new Map()
globalThis.window = {
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  },
}

beforeEach(() => {
  storage.clear()
})

after(() => { delete globalThis.window })

test('initial owner account is seeded automatically and can authenticate', async () => {
  const users = readUsers()
  assert.equal(users.length, 1)
  assert.equal(users[0].fullName, 'Mohamed')
  assert.equal(users[0].email, 'mohamed@flowboard.com')
  assert.equal(users[0].role, 'owner')

  const authenticated = await authenticateUser(users, { email: 'Mohamed@flowboard.com', password: 'mohamed123' })
  assert.equal(authenticated.fullName, 'Mohamed')
  assert.equal(authenticated.role, 'owner')

  const secondRead = readUsers()
  assert.equal(secondRead.length, 1)
  assert.equal(secondRead[0].id, users[0].id)
})

test('migrates existing legacy users without role to default member role while preserving data', () => {
  const legacyUsers = [
    {
      id: 'legacy-1',
      fullName: 'Legacy User',
      email: 'legacy@example.test',
      passwordHash: 'pbkdf2-sha256$210000$salt$hash',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  const { users, modified } = migrateUsers(legacyUsers)
  assert.equal(modified, true)
  assert.equal(users.length, 2)
  const legacy = users.find((u) => u.id === 'legacy-1')
  assert.ok(legacy)
  assert.equal(legacy.role, 'member')
  assert.equal(legacy.email, 'legacy@example.test')

  const owner = users.find((u) => u.email === INITIAL_OWNER.email)
  assert.ok(owner)
  assert.equal(owner.role, 'owner')
})

test('register, persist, and authenticate separate accounts without saving plain passwords', async () => {
  const initialUsers = readUsers()
  assert.equal(initialUsers.length, 1)

  const first = await registerUser(initialUsers, { fullName: 'Ada Lovelace', email: 'A@example.test', password: 'first-pass-123' })
  window.localStorage.setItem(USERS_KEY, JSON.stringify(first.users))

  assert.equal(first.users.length, 2)
  assert.equal(first.user.email, 'a@example.test')
  assert.equal(first.user.role, 'member')
  assert.match(first.user.passwordHash, /^pbkdf2-sha256\$210000\$/)
  assert.equal(JSON.stringify(first.user).includes('first-pass-123'), false)

  const currentUsers = readUsers()
  assert.equal((await authenticateUser(currentUsers, { email: 'A@EXAMPLE.TEST', password: 'first-pass-123' })).id, first.user.id)
  assert.equal((await authenticateUser(currentUsers, { email: 'mohamed@flowboard.com', password: 'mohamed123' })).role, 'owner')

  await assert.rejects(registerUser(currentUsers, { fullName: 'Ada Again', email: 'a@example.test', password: 'another-pass-123' }), /already exists/i)
  await assert.rejects(registerUser(currentUsers, { fullName: 'Owner Duplicate', email: 'mohamed@flowboard.com', password: 'another-pass-123' }), /already exists/i)
  await assert.rejects(authenticateUser(currentUsers, { email: 'a@example.test', password: 'wrong-pass-123' }), /Incorrect password\./)
  await assert.rejects(authenticateUser(currentUsers, { email: 'missing@example.test', password: 'first-pass-123' }), /No account found with this email\./)

  const second = await registerUser(currentUsers, { fullName: 'Grace Hopper', email: 'b@example.test', password: 'second-pass-456' })
  window.localStorage.setItem(USERS_KEY, JSON.stringify(second.users))
  assert.equal(readUsers().length, 3)
  assert.notEqual(first.user.id, second.user.id)
  assert.equal((await authenticateUser(readUsers(), { email: 'b@example.test', password: 'second-pass-456' })).id, second.user.id)
})
