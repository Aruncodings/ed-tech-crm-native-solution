"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { CustomFieldsDialog } from "@/components/admin/custom-fields-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface CustomField {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  isRequired: boolean;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin/settings");
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
            fetchCustomFields();
          }
        });
    }
  }, [session, isPending, router]);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch("/api/custom-fields-new?limit=1000");
      const data = await response.json();
      setCustomFields(data);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateField = () => {
    setSelectedField(null);
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: CustomField) => {
    setSelectedField(field);
    setIsFieldDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/custom-fields-new?id=${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Custom field deleted successfully");
        setCustomFields(customFields.filter((field) => field.id !== deleteId));
        setDeleteId(null);
      } else {
        toast.error("Failed to delete custom field");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const groupedFields = customFields.reduce((acc, field) => {
    if (!acc[field.entityType]) {
      acc[field.entityType] = [];
    }
    acc[field.entityType].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

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
            <h1 className="text-xl font-bold">System Settings</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="custom-fields" className="space-y-4">
          <TabsList>
            <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
            <TabsTrigger value="dropdowns">Dropdown Values</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="custom-fields">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Custom Fields</CardTitle>
                    <CardDescription>
                      Manage dynamic fields for leads, courses, and call logs ({customFields.length} total)
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedFields).map(([entityType, fields]) => (
                  <div key={entityType}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">
                      {entityType.replace(/_/g, " ")} Fields
                    </h3>
                    <div className="space-y-2">
                      {fields
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((field) => (
                          <Card key={field.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{field.fieldLabel}</h4>
                                    <Badge variant="outline">{field.fieldName}</Badge>
                                    <Badge variant="secondary">{field.fieldType}</Badge>
                                    {field.isRequired && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    {!field.isVisible && (
                                      <Badge variant="secondary" className="text-xs">
                                        Hidden
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Display order: {field.displayOrder}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditField(field)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteId(field.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No custom fields for {entityType.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedFields).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No custom fields created yet. Click "Add Field" to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dropdowns">
            <Card>
              <CardHeader>
                <CardTitle>Dropdown Master Values</CardTitle>
                <CardDescription>
                  Manage centralized dropdown options (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">Dropdown management interface</p>
                  <p className="text-sm">Configure lead sources, stages, and other dropdown values</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  System configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">System Name</p>
                      <p className="text-sm text-muted-foreground">Ed-Tech CRM</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Time Zone</p>
                      <p className="text-sm text-muted-foreground">Asia/Kolkata (IST)</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Date Format</p>
                      <p className="text-sm text-muted-foreground">DD/MM/YYYY</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CustomFieldsDialog
        open={isFieldDialogOpen}
        onOpenChange={setIsFieldDialogOpen}
        field={selectedField}
        onSuccess={fetchCustomFields}
      />
      
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom field? This action cannot be undone.
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
