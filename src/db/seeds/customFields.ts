import { db } from '@/db';
import { customFields } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleCustomFields = [
        {
            fieldName: 'highest_education',
            fieldType: 'dropdown',
            fieldLabel: 'Highest Education Level',
            isRequired: true,
            isVisible: true,
            dropdownOptions: ['High School', 'Undergraduate', 'Graduate', 'Postgraduate'],
            displayOrder: 1,
            appliesTo: 'lead',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            fieldName: 'current_occupation',
            fieldType: 'text',
            fieldLabel: 'Current Occupation',
            isRequired: false,
            isVisible: true,
            dropdownOptions: null,
            displayOrder: 2,
            appliesTo: 'lead',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            fieldName: 'preferred_batch_time',
            fieldType: 'dropdown',
            fieldLabel: 'Preferred Batch Timing',
            isRequired: true,
            isVisible: true,
            dropdownOptions: ['Morning', 'Afternoon', 'Evening', 'Weekend'],
            displayOrder: 3,
            appliesTo: 'lead',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            fieldName: 'budget_amount',
            fieldType: 'number',
            fieldLabel: 'Maximum Budget (INR)',
            isRequired: false,
            isVisible: true,
            dropdownOptions: null,
            displayOrder: 4,
            appliesTo: 'lead',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            fieldName: 'demo_completed',
            fieldType: 'checkbox',
            fieldLabel: 'Demo Session Completed',
            isRequired: false,
            isVisible: true,
            dropdownOptions: null,
            displayOrder: 1,
            appliesTo: 'call_log',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            fieldName: 'payment_plan',
            fieldType: 'dropdown',
            fieldLabel: 'Payment Plan',
            isRequired: false,
            isVisible: true,
            dropdownOptions: ['One-time', 'EMI-3months', 'EMI-6months', 'EMI-12months'],
            displayOrder: 2,
            appliesTo: 'course',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(customFields).values(sampleCustomFields);
    
    console.log('✅ Custom fields seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});