"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { CourseDialog } from "@/components/admin/course-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  durationMonths: number | null;
  feeAmount: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin/courses");
      return;
    }

    if (session?.user?.email) {
      fetch(`/api/users?search=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const user = data[0];
            if (user.role !== "admin" && user.role !== "super_admin") {
              router.push("/dashboard");
              return;
            }
            fetchCourses();
          }
        });
    }
  }, [session, isPending, router]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses-new?limit=1000");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/courses-new?id=${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Course deleted successfully");
        setCourses(courses.filter((course) => course.id !== deleteId));
        setDeleteId(null);
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Course Management</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>
                  Manage all courses in the system ({filteredCourses.length} total)
                </CardDescription>
              </div>
              <Button onClick={handleCreateCourse}>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Courses Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No courses found
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <Card key={course.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {course.code}
                          </Badge>
                        </div>
                        <Badge
                          variant={course.isActive ? "default" : "secondary"}
                          className={
                            course.isActive
                              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                              : ""
                          }
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {course.durationMonths && (
                          <span>📅 {course.durationMonths} months</span>
                        )}
                        {course.feeAmount && (
                          <span>💰 ₹{parseInt(course.feeAmount).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <CourseDialog
        open={isCourseDialogOpen}
        onOpenChange={setIsCourseDialogOpen}
        course={selectedCourse}
        onSuccess={fetchCourses}
      />
      
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
