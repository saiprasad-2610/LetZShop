import crypto from 'node:crypto';
import readline from 'node:readline';
import { PrismaClient, UserRole, CredentialType } from '@prisma/client';
import { normalizePhone } from '@simply/validation';

/**
 * Masks sensitive credentials inside a database connection string for safe console output.
 */
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return 'postgresql://[masked]';
  }
}

/**
 * Hashes an administrator password/PIN using the exact scrypt method enforced by AuthService.
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const scryptHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${scryptHash}`;
}

/**
 * Validates admin password complexity.
 */
function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
}

/**
 * Reads standard text from readline interface.
 */
function promptText(query: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const promptLabel = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
    rl.question(promptLabel, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val || defaultValue || '');
    });
  });
}

/**
 * Reads a secret securely from stdin with asterisks masking on interactive TTY terminals.
 */
function promptSecret(query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(query);

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      let input = '';

      const onData = (buffer: Buffer) => {
        const str = buffer.toString('utf-8');
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '\n' || char === '\r' || char === '\u0004') {
            stdin.setRawMode(false);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(input);
            return;
          } else if (char === '\u0003') {
            // Ctrl+C
            stdin.setRawMode(false);
            process.stdout.write('\nOperation cancelled by user.\n');
            process.exit(130);
          } else if (char === '\b' || char === '\x7f') {
            // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            input += char;
            process.stdout.write('*');
          }
        }
      };

      stdin.on('data', onData);
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  console.log('================================================================');
  console.log('🔐 LetZShop Platform: Super Admin Account Provisioning');
  console.log('================================================================\n');

  // 1. Resolve and validate database connection
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is required.');
    console.error('   Please run with: DATABASE_URL="postgresql://..." pnpm admin:create');
    process.exit(1);
  }

  console.log(`📡 Target Database: ${maskDatabaseUrl(databaseUrl)}\n`);

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  const args = process.argv.slice(2);
  const isResetAllowed = args.includes('--reset-password');

  try {
    // Test connectivity
    await prisma.$queryRaw`SELECT 1`;

    // 2. Resolve credentials from environment or interactive prompt
    const isInteractive = Boolean(process.stdin.isTTY);

    let fullName = (process.env.SUPER_ADMIN_NAME || process.env.ADMIN_NAME || '').trim();
    let email = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    let phone = (process.env.SUPER_ADMIN_PHONE || process.env.ADMIN_PHONE || '').trim();
    let password = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

    if (!fullName && isInteractive) {
      fullName = await promptText('Enter Super Admin Full Name', 'Platform SuperAdmin');
    }
    fullName = fullName || 'Platform SuperAdmin';

    if (!email && isInteractive) {
      email = (await promptText('Enter Super Admin Email address')).toLowerCase();
    }

    if (!email) {
      console.error('❌ Error: Super Admin email is required.');
      console.error('   Provide SUPER_ADMIN_EMAIL environment variable or input via terminal.');
      process.exit(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`❌ Error: "${email}" is not a valid email address.`);
      process.exit(1);
    }

    if (!phone && isInteractive) {
      phone = await promptText('Enter Super Admin Mobile Phone (E.164, e.g. +919800000000)', '+919800000000');
    }
    phone = phone || '+919800000000';

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch {
      normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    }

    // 3. Safety & Idempotency Check: Inspect existing database records
    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      include: { credentials: true },
    });

    const existingByPhone = await prisma.user.findFirst({
      where: { phone: normalizedPhone, deletedAt: null },
      include: { credentials: true },
    });

    // Check A: Refuse to convert existing seller account
    if (existingByEmail && existingByEmail.role !== UserRole.PLATFORM_ADMIN) {
      console.error(`❌ Security Violation: Account "${email}" already exists with role "${existingByEmail.role}".`);
      console.error('   Silently elevating a merchant/seller account to Super Admin is strictly prohibited.');
      console.error('   Please provide a separate, dedicated platform administrator email address.');
      process.exit(1);
    }

    if (existingByPhone && existingByPhone.role !== UserRole.PLATFORM_ADMIN) {
      console.error(`❌ Security Violation: Account with phone "${normalizedPhone}" already exists with role "${existingByPhone.role}".`);
      console.error('   Please provide a separate, dedicated phone number for the platform administrator.');
      process.exit(1);
    }

    // Check B: Account already exists as Super Admin
    if (existingByEmail && existingByEmail.isSuperAdmin) {
      if (!isResetAllowed) {
        console.log(`ℹ️  Idempotent Check: Super Admin account already exists for "${email}".`);
        console.log(`   User ID:     ${existingByEmail.id}`);
        console.log(`   Full Name:   ${existingByEmail.fullName}`);
        console.log(`   Role:        ${existingByEmail.role}`);
        console.log(`   Super Admin: ${existingByEmail.isSuperAdmin ? 'YES' : 'NO'}`);
        console.log(`   Status:      ${existingByEmail.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        console.log('\n🔒 No changes were made.');
        console.log('   To reset the password for this existing Super Admin, run with the --reset-password flag:');
        console.log('   pnpm admin:create --reset-password');
        process.exit(0);
      } else {
        console.log(`⚠️  Password Reset Requested for existing Super Admin "${email}".`);
      }
    }

    // 4. Resolve and validate password
    if (!password && isInteractive) {
      password = await promptSecret('Enter Super Admin Password (min 12 chars, upper/lower/num/symbol): ');
      const confirm = await promptSecret('Confirm Super Admin Password: ');
      if (password !== confirm) {
        console.error('❌ Error: Passwords do not match.');
        process.exit(1);
      }
    }

    if (!password) {
      console.error('❌ Error: Password is required to create a Super Admin account.');
      console.error('   Set SUPER_ADMIN_PASSWORD in environment or run interactively in a terminal.');
      process.exit(1);
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      console.error(`❌ Password Policy Error: ${passwordCheck.reason}`);
      process.exit(1);
    }

    // 5. Hash password with scryptSync matching AuthService
    const pinHash = hashPassword(password);

    // 6. Execute database transaction
    await prisma.$transaction(async (tx) => {
      let user = existingByEmail;

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            phone: normalizedPhone,
            fullName,
            role: UserRole.PLATFORM_ADMIN,
            isSuperAdmin: true,
            isActive: true,
            adminPermissions: [],
            mustChangePassword: false,
            isDeactivated: false,
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            role: UserRole.PLATFORM_ADMIN,
            isSuperAdmin: true,
            isActive: true,
            isDeactivated: false,
          },
        });
      }

      await tx.sellerCredential.upsert({
        where: {
          userId_credentialType: {
            userId: user.id,
            credentialType: CredentialType.PIN,
          },
        },
        create: {
          userId: user.id,
          credentialType: CredentialType.PIN,
          pinHash,
          failedPinAttempts: 0,
          lockedUntil: null,
        },
        update: {
          pinHash,
          failedPinAttempts: 0,
          lockedUntil: null,
        },
      });
    });

    console.log('\n================================================================');
    console.log('✅ Super Admin Account Successfully Provisioned!');
    console.log('================================================================');
    console.log(`  Name:        ${fullName}`);
    console.log(`  Email:       ${email}`);
    console.log(`  Phone:       ${normalizedPhone}`);
    console.log(`  Role:        PLATFORM_ADMIN`);
    console.log(`  Super Admin: true`);
    console.log('----------------------------------------------------------------');
    console.log('  Login URL:   https://let-z-shop-zyvx.vercel.app/login');
    console.log('  Identifier:  Use either your email or phone number to sign in.');
    console.log('================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal Error during Super Admin provisioning:');
  console.error(err?.message || err);
  process.exit(1);
});
