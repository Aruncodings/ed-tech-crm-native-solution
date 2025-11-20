import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleUsers = [
        {
            email: 'rajesh.kumar@edtech.com',
            name: 'Rajesh Kumar',
            role: 'super_admin',
            phone: '+91-9876543210',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'priya.sharma@edtech.com',
            name: 'Priya Sharma',
            role: 'admin',
            phone: '+91-9876543211',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'amit.patel@edtech.com',
            name: 'Amit Patel',
            role: 'telecaller',
            phone: '+91-9876543212',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'sneha.reddy@edtech.com',
            name: 'Sneha Reddy',
            role: 'telecaller',
            phone: '+91-9876543213',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'vikram.singh@edtech.com',
            name: 'Vikram Singh',
            role: 'counselor',
            phone: '+91-9876543214',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});