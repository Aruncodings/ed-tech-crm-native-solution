import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leadsNew } from "@/db/schema";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (const [index, row] of results.data.entries()) {
            try {
              const data: any = row;

              // Validate required fields
              if (!data.name || !data.phone || !data.leadSource) {
                errorCount++;
                errors.push(`Row ${index + 2}: Missing required fields (name, phone, leadSource)`);
                continue;
              }

              // Prepare lead data
              const leadData = {
                name: data.name,
                phone: data.phone,
                email: data.email || null,
                whatsappNumber: data.whatsappNumber || null,
                leadSource: data.leadSource,
                leadStage: data.leadStage || "new",
                leadStatus: data.leadStatus || "active",
                courseInterestId: data.courseInterestId ? parseInt(data.courseInterestId) : null,
                assignedTelecallerId: data.assignedTelecallerId ? parseInt(data.assignedTelecallerId) : null,
                assignedCounselorId: data.assignedCounselorId ? parseInt(data.assignedCounselorId) : null,
                city: data.city || null,
                state: data.state || null,
                country: data.country || null,
                educationLevel: data.educationLevel || null,
                currentOccupation: data.currentOccupation || null,
                notes: data.notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await db.insert(leadsNew).values(leadData);
              successCount++;
            } catch (error: any) {
              errorCount++;
              errors.push(`Row ${index + 2}: ${error.message}`);
            }
          }

          resolve(
            NextResponse.json({
              message: "Import completed",
              successCount,
              errorCount,
              errors: errors.slice(0, 10), // Return first 10 errors
            })
          );
        },
        error: (error) => {
          resolve(
            NextResponse.json(
              { message: "Failed to parse CSV file", error: error.message },
              { status: 400 }
            )
          );
        },
      });
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { message: "Import failed", error: error.message },
      { status: 500 }
    );
  }
}
