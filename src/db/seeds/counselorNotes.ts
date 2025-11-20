import { db } from '@/db';
import { counselorNotes } from '@/db/schema';

async function main() {
    const sampleNotes = [
        // Followup notes (9 records - 36%)
        {
            leadId: 3,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Following up after demo session. Student very impressed with curriculum structure and teaching methodology. Expressed strong interest in Data Science program.',
            isImportant: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 8,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Checking on payment status. Family discussing EMI options. Will make final decision by end of this week.',
            isImportant: true,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 12,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Reminder sent for upcoming batch start date. Confirmed attendance for orientation session. Student ready to begin.',
            isImportant: false,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 15,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Second follow-up call completed. Student still evaluating between our program and competitor. Highlighted our placement record and industry partnerships.',
            isImportant: true,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 18,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Follow-up on scholarship application. Documents received and under review. Expected to hear back within 5 business days.',
            isImportant: false,
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 21,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Touched base after trial class. Student loved the interactive learning approach. Discussing payment plans to finalize enrollment.',
            isImportant: false,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 25,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Following up on course material inquiry. Shared detailed syllabus and project portfolio. Student reviewing before making decision.',
            isImportant: false,
            createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 27,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Post-demo follow-up. Parent had additional questions about course duration and flexibility. Clarified all doubts regarding weekend batches.',
            isImportant: true,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 29,
            counselorId: 5,
            noteType: 'followup',
            notes: 'Final follow-up before batch commencement. Confirmed laptop specifications and software requirements. Student all set to start.',
            isImportant: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Meeting notes (7 records - 28%)
        {
            leadId: 5,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Had detailed discussion about career prospects post-course. Parent also attended meeting. Discussed 95% placement rate and average salary packages.',
            isImportant: true,
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 10,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Explained placement assistance program in detail. Student excited about job opportunities and corporate partnerships. Reviewed sample placement cases.',
            isImportant: false,
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 14,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Career counseling session completed. Recommended Data Science track based on mathematics background and career interests. Perfect fit.',
            isImportant: false,
            createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 19,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'One-on-one counseling session focused on course structure and learning outcomes. Addressed concerns about balancing work and study. Recommended evening batch.',
            isImportant: false,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 22,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Parent-student joint meeting conducted. Discussed investment value and ROI. Shared success stories of past students from similar backgrounds.',
            isImportant: true,
            createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 26,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Technical assessment and career roadmap session. Student has strong foundation in programming. Can fast-track to advanced modules.',
            isImportant: false,
            createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 30,
            counselorId: 5,
            noteType: 'meeting',
            notes: 'Final enrollment meeting. Reviewed course agreement, payment schedule, and batch timings. Student signed up for June batch starting next week.',
            isImportant: true,
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Demo notes (5 records - 20%)
        {
            leadId: 7,
            counselorId: 5,
            noteType: 'demo',
            notes: 'Conducted live coding demo. Student actively participated and asked relevant questions about React hooks and state management. Very engaged.',
            isImportant: false,
            createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 11,
            counselorId: 5,
            noteType: 'demo',
            notes: 'Product demo completed. Showcased LMS platform, learning resources, and recorded sessions. Student impressed with interface and mobile app accessibility.',
            isImportant: false,
            createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 16,
            counselorId: 5,
            noteType: 'demo',
            notes: 'Free trial class provided for Machine Learning module. Positive feedback on teaching methodology and hands-on approach. Student wants to continue.',
            isImportant: true,
            createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 23,
            counselorId: 5,
            noteType: 'demo',
            notes: 'Platform walkthrough demo. Showed assignment submission system, peer code review features, and mentor support channels. All questions answered satisfactorily.',
            isImportant: false,
            createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 28,
            counselorId: 5,
            noteType: 'demo',
            notes: 'Live project demo conducted. Demonstrated capstone project requirements and evaluation criteria. Student excited about building real-world portfolio.',
            isImportant: false,
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // General notes (4 records - 16%)
        {
            leadId: 6,
            counselorId: 5,
            noteType: 'general',
            notes: 'Student has prior programming knowledge in Python and basic web development. Can skip beginner modules and start directly from intermediate level.',
            isImportant: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 13,
            counselorId: 5,
            noteType: 'general',
            notes: 'Special request for weekend batch due to current work schedule. Will be joining Saturday-Sunday 10 AM batch starting next month.',
            isImportant: false,
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 17,
            counselorId: 5,
            noteType: 'general',
            notes: 'Referred by existing student Priya Sharma from April batch. Offering referral discount of 15%. Student interested in Full Stack Development program.',
            isImportant: false,
            createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            leadId: 20,
            counselorId: 5,
            noteType: 'general',
            notes: 'International student from Dubai. Requires flexible timing due to time zone difference. Arranged for recorded sessions and asynchronous mentorship support.',
            isImportant: true,
            createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(counselorNotes).values(sampleNotes);
    
    console.log('✅ Counselor notes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});