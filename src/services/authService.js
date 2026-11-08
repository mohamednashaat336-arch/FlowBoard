export const USERS_KEY = 'flowboard_users'
export const SESSION_KEY = 'flowboard_current_user_id'
const HASH_ITERATIONS = 210_000
const HASH_BYTES = 32

export const INITIAL_OWNER = {
  id: 'owner-permanent-mohamed',
  fullName: 'Mohamed',
  email: 'mohamed@flowboard.com',
  role: 'owner',
  passwordHash: 'pbkdf2-sha256$210000$DvG3nQ0lnBrKpDOmWcnVuA==$vL+7MvtBfEGSmWL3wAzCbkbaK9Gv4/sKHN9rIW0dwq8=',
  createdAt: '2026-01-01T00:00:00.000Z',
}

export const VALID_ROLES = new Set(['owner', 'admin', 'member', 'viewer'])

export function migrateUsers(rawUsers) {
  const existingList = Array.isArray(rawUsers) ? rawUsers.filter((user) => (
    user && typeof user.id === 'string' && typeof user.fullName === 'string'
    && typeof user.email === 'string' && typeof user.passwordHash === 'string'
    && typeof user.createdAt === 'string'
  )) : []

  let modified = false
  const ownerEmail = INITIAL_OWNER.email.toLowerCase()

  const sanitized = existingList.map((user) => {
    const isOwnerByEmail = user.email.toLowerCase() === ownerEmail
    let role = user.role
    if (isOwnerByEmail && role !== 'owner') {
      role = 'owner'
      modified = true
    } else if (!VALID_ROLES.has(role)) {
      role = isOwnerByEmail ? 'owner' : 'member'
      modified = true
    }
    return role !== user.role ? { ...user, role } : user
  })

  const hasOwner = sanitized.some((user) => user.email.toLowerCase() === ownerEmail)
  if (!hasOwner) {
    sanitized.unshift({ ...INITIAL_OWNER })
    modified = true
  }

  return { users: sanitized, modified }
}

export function readUsers() {
  try {
    const raw = JSON.parse(window.localStorage?.getItem(USERS_KEY) || 'null')
    const { users, modified } = migrateUsers(raw ?? [])
    if (modified && window.localStorage?.setItem) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    return users
  } catch {
    return [{ ...INITIAL_OWNER }]
  }
}

function bytesToBase64(bytes) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return window.btoa(binary)
}

function base64ToBytes(value) {
  return Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0))
}

async function derivePasswordHash(password, salt, iterations = HASH_ITERATIONS) {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Password hashing is unavailable in this browser context. Open FlowBoard on localhost or HTTPS and try again.')
  }
  const keyMaterial = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, keyMaterial, HASH_BYTES * 8)
  return new Uint8Array(bits)
}

function parseHash(passwordHash) {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = passwordHash.split('$')
  const iterations = Number(iterationsRaw)
  if (algorithm !== 'pbkdf2-sha256' || !Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000 || !saltRaw || !hashRaw) return null
  try {
    const salt = base64ToBytes(saltRaw)
    const hash = base64ToBytes(hashRaw)
    return salt.length >= 16 && hash.length === HASH_BYTES ? { iterations, salt, hash } : null
  } catch { return null }
}

function hashesMatch(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

export async function registerUser(users, { fullName, email, password, role = 'member' }) {
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (normalizedName.length < 2 || normalizedName.length > 80) throw new Error('Enter your full name (2 to 80 characters).')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.')
  if (typeof password !== 'string' || password.length < 8) throw new Error('Use at least 8 characters for your password.')
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) throw new Error('An account with this email already exists.')
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure password hashing is unavailable in this browser context. Open FlowBoard on localhost or HTTPS and try again.')
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePasswordHash(password, salt)
  const assignedRole = (role === 'admin' || role === 'viewer') ? role : 'member'
  const user = {
    id: globalThis.crypto.randomUUID?.() ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    fullName: normalizedName,
    email: normalizedEmail,
    role: assignedRole,
    passwordHash: `pbkdf2-sha256$${HASH_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`,
    createdAt: new Date().toISOString(),
  }
  return { user, users: [...users, user] }
}

export async function authenticateUser(users, { email, password }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail)
  if (!user) throw new Error('No account found with this email.')
  const stored = parseHash(user.passwordHash)
  if (!stored) throw new Error('This account has an unreadable password hash. Register a new account to continue.')
  const enteredHash = await derivePasswordHash(password, stored.salt, stored.iterations)
  if (!hashesMatch(enteredHash, stored.hash)) throw new Error('Incorrect password.')
  return user
}
