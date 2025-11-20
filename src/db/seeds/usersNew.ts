import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'rajesh.kumar@edtech.com',
            name: 'Rajesh Kumar',
            role: 'super_admin',
            phone: '+91-9876543210',
            isActive: true,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
        },
        {
            email: 'priya.sharma@edtech.com',
            name: 'Priya Sharma',
            role: 'admin',
            phone: '+91-9876543211',
            isActive: true,
            createdAt: new Date('2024-01-05').toISOString(),
            updatedAt: new Date('2024-01-05').toISOString(),
        },
        {
            email: 'amit.patel@edtech.com',
            name: 'Amit Patel',
            role: 'telecaller',
            phone: '+91-9876543212',
            isActive: true,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            email: 'sneha.reddy@edtech.com',
            name: 'Sneha Reddy',
            role: 'telecaller',
            phone: '+91-9876543213',
            isActive: true,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            email: 'vikram.singh@edtech.com',
            name: 'Vikram Singh',
            role: 'counselor',
            phone: '+91-9876543214',
            isActive: true,
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});