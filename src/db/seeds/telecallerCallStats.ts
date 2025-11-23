import { db } from '@/db';
import { telecallerCallStats } from '@/db/schema';

async function main() {
    const telecallerIds = [11, 12]; // Amit Patel and Sneha Reddy
    const sampleStats = [];
    
    // Generate data for last 30 days
    const today = new Date();
    
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Create timestamps for the day
        const createdAt = new Date(date);
        createdAt.setHours(18, 0, 0, 0); // End of work day
        const createdAtStr = createdAt.toISOString();
        
        for (const telecallerId of telecallerIds) {
            // Determine call volume based on day of week
            let minCalls, maxCalls;
            if (isWeekend) {
                minCalls = 5;
                maxCalls = 15;
            } else {
                minCalls = 15;
                maxCalls = 30;
            }
            
            // Generate calls made
            const callsMade = Math.floor(Math.random() * (maxCalls - minCalls + 1)) + minCalls;
            
            // Calculate calls answered (60-80% of calls made)
            const answerRate = 0.6 + Math.random() * 0.2;
            const callsAnswered = Math.floor(callsMade * answerRate);
            
            // Calculate total duration (3-8 minutes per answered call)
            const avgDurationPerCall = 180 + Math.floor(Math.random() * 300); // 180-480 seconds
            const totalDurationSeconds = callsAnswered * avgDurationPerCall;
            
            // Leads contacted equals calls made
            const leadsContacted = callsMade;
            
            // Calculate leads converted (5-15% of leads contacted)
            const conversionRate = 0.05 + Math.random() * 0.1;
            const leadsConverted = Math.floor(leadsContacted * conversionRate);
            
            sampleStats.push({
                telecallerId,
                date: dateStr,
                callsMade,
                callsAnswered,
                totalDurationSeconds,
                leadsContacted,
                leadsConverted,
                createdAt: createdAtStr,
                updatedAt: createdAtStr,
            });
        }
    }
    
    await db.insert(telecallerCallStats).values(sampleStats);
    
    console.log('✅ Telecaller call stats seeder completed successfully');
    console.log(`   Generated ${sampleStats.length} records (${telecallerIds.length} telecallers × 30 days)`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});