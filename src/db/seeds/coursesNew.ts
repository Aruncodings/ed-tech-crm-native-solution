import { db } from '@/db';
import { coursesNew } from '@/db/schema';

async function main() {
    const sampleCourses = [
        {
            name: 'Full Stack Web Development',
            code: 'FSWD101',
            description: 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build production-ready web applications with modern frameworks.',
            durationMonths: 6,
            feeAmount: '49999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Data Science & Machine Learning',
            code: 'DS201',
            description: 'Learn Python, Statistics, ML algorithms, Deep Learning, and AI. Work on real-world data science projects.',
            durationMonths: 8,
            feeAmount: '79999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Digital Marketing Mastery',
            code: 'DM301',
            description: 'Complete digital marketing course covering SEO, SEM, Social Media, Content Marketing, and Analytics.',
            durationMonths: 4,
            feeAmount: '34999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'UI/UX Design Professional',
            code: 'UXUI401',
            description: 'Master design thinking, Figma, Adobe XD, prototyping, and user research. Build stunning user experiences.',
            durationMonths: 5,
            feeAmount: '39999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Python Programming Bootcamp',
            code: 'PY101',
            description: 'Learn Python from scratch. Cover fundamentals, OOP, data structures, and practical applications.',
            durationMonths: 3,
            feeAmount: '19999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Cloud Computing with AWS',
            code: 'AWS501',
            description: 'Master AWS services, cloud architecture, DevOps, CI/CD, and infrastructure as code.',
            durationMonths: 6,
            feeAmount: '54999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Mobile App Development',
            code: 'MAD601',
            description: 'Build native and cross-platform mobile apps using React Native and Flutter. Publish to app stores.',
            durationMonths: 5,
            feeAmount: '44999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Cybersecurity Specialist',
            code: 'CS701',
            description: 'Learn ethical hacking, network security, penetration testing, and security operations.',
            durationMonths: 7,
            feeAmount: '64999',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Business Analytics & Tableau',
            code: 'BA801',
            description: 'Master data visualization, BI tools, Tableau, Power BI, and business intelligence concepts.',
            durationMonths: 4,
            feeAmount: '32999',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Blockchain Development',
            code: 'BC901',
            description: 'Learn blockchain technology, smart contracts, Solidity, Web3, and DeFi applications.',
            durationMonths: 6,
            feeAmount: '59999',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(coursesNew).values(sampleCourses);
    
    console.log('✅ Courses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});