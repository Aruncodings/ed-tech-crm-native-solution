import { db } from '@/db';
import { callLogs } from '@/db/schema';

async function main() {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 45);

    const callStatuses = ['answered', 'no_answer', 'callback', 'busy', 'invalid'];
    const statusWeights = [40, 25, 20, 10, 5];
    const callTypes = ['outbound', 'inbound'];
    const typeWeights = [80, 20];
    const callerIds = [3, 4, 5];

    const answeredNotes = [
        'Interested in Full Stack course, asking about EMI options',
        'Very interested, scheduled counselor meeting for next week',
        'Wants to join Data Science batch starting next month',
        'Discussing payment plans and course duration',
        'Asking about placement assistance and job guarantee',
        'Interested but needs to discuss with family first',
        'Ready to enroll, sending payment link',
        'Comparing our course with other institutes',
        'Wants weekend batch for Web Development',
        'Asked for demo class before enrollment',
        'Interested in Python course, discussing syllabus',
        'Budget concerns, explained EMI options available',
        'Very excited about AI/ML course, wants to start ASAP',
        'Asked about instructor experience and credentials',
        'Wants to know about certificate value in industry',
        'Discussing career transition to software development',
        'Parent called, asking about course details for son',
        'Working professional, interested in evening batches',
        'College student, asking about student discount',
        'Wants to upgrade from basic to advanced course'
    ];

    const noAnswerNotes = [
        'Not reachable, will call back tomorrow',
        'Phone switched off, trying again later',
        'Not picking up, sent SMS with callback request',
        'Tried 3 times, phone busy each time',
        'Out of network area, will retry in evening',
        'Number not reachable since morning',
        'Called during work hours, will try evening',
        'Phone ringing but not answering',
        'Voicemail activated, left message'
    ];

    const callbackNotes = [
        'Requested callback after 6 PM today',
        'In meeting, asked to call back in 2 hours',
        'Will be free tomorrow morning, scheduled callback',
        'Asked to call on weekend, noting for Saturday',
        'Busy right now, wants call back tomorrow evening',
        'Requested callback with more course details ready',
        'In class, will call back after 5 PM',
        'Asked to schedule call for next week Monday'
    ];

    const busyNotes = [
        'Line busy, will try again in 30 minutes',
        'Phone engaged, trying alternative number',
        'Busy signal, noting for retry later',
        'Called multiple times, always busy'
    ];

    const invalidNotes = [
        'Wrong number, needs correction in database',
        'Number belongs to someone else, lead info incorrect',
        'Invalid number, cannot complete call',
        'Number deactivated, need to update contact',
        'Lead gave wrong contact, trying to get correct one'
    ];

    const getRandomElement = (arr: any[], weights?: number[]) => {
        if (!weights) return arr[Math.floor(Math.random() * arr.length)];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < arr.length; i++) {
            if (random < weights[i]) return arr[i];
            random -= weights[i];
        }
        return arr[arr.length - 1];
    };

    const getNotesForStatus = (status: string) => {
        switch (status) {
            case 'answered': return getRandomElement(answeredNotes);
            case 'no_answer': return getRandomElement(noAnswerNotes);
            case 'callback': return getRandomElement(callbackNotes);
            case 'busy': return getRandomElement(busyNotes);
            case 'invalid': return getRandomElement(invalidNotes);
            default: return 'Call completed';
        }
    };

    const getDurationForStatus = (status: string) => {
        if (status === 'answered') {
            return Math.floor(Math.random() * (900 - 120 + 1)) + 120;
        } else if (status === 'no_answer' || status === 'busy') {
            return Math.floor(Math.random() * 31);
        }
        return null;
    };

    const getNextFollowup = () => {
        if (Math.random() < 0.5) {
            const followupDate = new Date();
            followupDate.setDate(followupDate.getDate() + Math.floor(Math.random() * 7) + 1);
            return followupDate.toISOString();
        }
        return null;
    };

    const getRandomDateInLast45Days = () => {
        const daysAgo = Math.floor(Math.random() * 45);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 12) + 9);
        date.setMinutes(Math.floor(Math.random() * 60));
        return date.toISOString();
    };

    const leadCallCounts = [
        ...Array(20).fill(0).map((_, i) => ({ leadId: i + 1, calls: Math.floor(Math.random() * 3) + 3 })),
        ...Array(20).fill(0).map((_, i) => ({ leadId: i + 21, calls: Math.floor(Math.random() * 3) + 1 })),
        ...Array(15).fill(0).map((_, i) => ({ leadId: i + 41, calls: Math.floor(Math.random() * 3) })),
    ];

    const sampleCallLogs = [];

    for (const { leadId, calls } of leadCallCounts) {
        const callDates = Array(calls).fill(0).map(() => getRandomDateInLast45Days()).sort();
        
        for (let i = 0; i < calls; i++) {
            const callStatus = getRandomElement(callStatuses, statusWeights);
            const callType = getRandomElement(callTypes, typeWeights);
            
            sampleCallLogs.push({
                leadId,
                callerId: getRandomElement(callerIds),
                callType,
                callStatus,
                callDuration: getDurationForStatus(callStatus),
                notes: getNotesForStatus(callStatus),
                nextFollowupDate: getNextFollowup(),
                createdAt: callDates[i],
            });
        }
    }

    await db.insert(callLogs).values(sampleCallLogs);
    
    console.log(`✅ Call logs seeder completed successfully - Generated ${sampleCallLogs.length} call logs`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});