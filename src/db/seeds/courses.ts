import { db } from '@/db';
import { courses } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleCourses = [
        {
            name: 'Full Stack Web Development Bootcamp',
            description: 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB in 6 months',
            price: '49999',
            duration: '6 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Data Science & Machine Learning',
            description: 'Learn Python, Statistics, ML algorithms, and AI fundamentals',
            price: '59999',
            duration: '8 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'UI/UX Design Masterclass',
            description: 'Complete design thinking, Figma, Adobe XD, and prototyping course',
            price: '34999',
            duration: '4 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Digital Marketing Pro',
            description: 'SEO, SEM, Social Media Marketing, Content Marketing, and Analytics',
            price: '29999',
            duration: '3 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Python Programming for Beginners',
            description: 'Start your coding journey with Python from scratch',
            price: '14999',
            duration: '2 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Cloud Computing with AWS',
            description: 'Master AWS services, DevOps, and cloud architecture',
            price: '44999',
            duration: '5 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Mobile App Development (React Native)',
            description: 'Build cross-platform mobile apps for iOS and Android',
            price: '39999',
            duration: '4 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Cybersecurity Fundamentals',
            description: 'Learn ethical hacking, network security, and penetration testing',
            price: '54999',
            duration: '6 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Business Analytics & Tableau',
            description: 'Data visualization, BI tools, and business intelligence',
            price: '32999',
            duration: '3 months',
            isActive: true,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Blockchain & Cryptocurrency',
            description: 'Understand blockchain technology, smart contracts, and Web3',
            price: '47999',
            duration: '5 months',
            isActive: false,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(courses).values(sampleCourses);
    
    console.log('✅ Courses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});