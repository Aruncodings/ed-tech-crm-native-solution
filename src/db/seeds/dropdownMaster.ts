import { db } from '@/db';
import { dropdownMaster } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleDropdowns = [
        {
            dropdownName: 'education_level',
            dropdownValues: ['High School', 'Undergraduate', 'Graduate', 'Postgraduate', 'PhD', 'Other'],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            dropdownName: 'employment_status',
            dropdownValues: ['Student', 'Working Professional', 'Freelancer', 'Unemployed', 'Business Owner'],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            dropdownName: 'budget_range',
            dropdownValues: ['< 20000', '20000-40000', '40000-60000', '60000+', 'Need EMI'],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            dropdownName: 'preferred_mode',
            dropdownValues: ['Online Live', 'Recorded Videos', 'Offline Classroom', 'Hybrid', 'Self-paced'],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            dropdownName: 'time_preference',
            dropdownValues: ['Morning (6AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-9PM)', 'Night (9PM-12AM)', 'Flexible'],
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(dropdownMaster).values(sampleDropdowns);
    
    console.log('✅ Dropdown master seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});