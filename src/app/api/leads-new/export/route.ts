import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leadsNew, coursesNew, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Fetch all leads with related data
    const leads = await db.select().from(leadsNew).all();
    const courses = await db.select().from(coursesNew).all();
    const allUsers = await db.select().from(users).all();

    // Create CSV content
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "WhatsApp",
      "Lead Source",
      "Lead Stage",
      "Lead Status",
      "Course Interest",
      "Assigned Telecaller",
      "Assigned Counselor",
      "City",
      "State",
      "Country",
      "Education Level",
      "Current Occupation",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const rows = leads.map((lead) => {
      const course = courses.find((c) => c.id === lead.courseInterestId);
      const telecaller = allUsers.find((u) => u.id === lead.assignedTelecallerId);
      const counselor = allUsers.find((u) => u.id === lead.assignedCounselorId);

      return [
        lead.id,
        escapeCsvField(lead.name),
        escapeCsvField(lead.email || ""),
        escapeCsvField(lead.phone),
        escapeCsvField(lead.whatsappNumber || ""),
        escapeCsvField(lead.leadSource),
        escapeCsvField(lead.leadStage),
        escapeCsvField(lead.leadStatus),
        escapeCsvField(course?.name || ""),
        escapeCsvField(telecaller?.name || ""),
        escapeCsvField(counselor?.name || ""),
        escapeCsvField(lead.city || ""),
        escapeCsvField(lead.state || ""),
        escapeCsvField(lead.country || ""),
        escapeCsvField(lead.educationLevel || ""),
        escapeCsvField(lead.currentOccupation || ""),
        escapeCsvField(lead.notes || ""),
        escapeCsvField(lead.createdAt),
        escapeCsvField(lead.updatedAt),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { message: "Export failed", error: error.message },
      { status: 500 }
    );
  }
}

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
