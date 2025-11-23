import { db } from '@/db';
import { users, user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function main() {
    try {
        // Check if admin user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, 'admin@edtech.com')).limit(1);
        
        if (existingUser.length > 0) {
            console.log('⚠️ Admin user already exists, skipping creation');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        // Generate UUID for better-auth user
        const authUserId = crypto.randomUUID();
        
        // Create better-auth user record
        await db.insert(user).values({
            id: authUserId,
            name: 'Admin User',
            email: 'admin@edtech.com',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Create account record with hashed password
        await db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: authUserId,
            providerId: 'credential',
            userId: authUserId,
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Create system user record
        await db.insert(users).values({
            email: 'admin@edtech.com',
            name: 'Admin User',
            role: 'admin',
            phone: '+91-9999999999',
            isActive: 1,
            isApproved: 1,
            mustChangePassword: 1,
            lastPasswordChange: null,
            dailyCallLimit: 0,
            monthlyCallLimit: 0,
            authUserId: authUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        console.log('✅ Admin user seeder completed successfully');
        console.log('📧 Email: admin@edtech.com');
        console.log('🔑 Password: Admin@123');
    } catch (error) {
        console.error('❌ Admin user seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});