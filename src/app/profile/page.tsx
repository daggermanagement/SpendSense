
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle, Edit3, Camera } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [localPhotoURL, setLocalPhotoURL] = React.useState<string | null | undefined>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user) {
      setValue("displayName", user.displayName || "");
      setLocalPhotoURL(user.photoURL);
    }
  }, [user, authLoading, setValue, router]);

  const handleNameUpdate = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    setIsSubmittingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
      // The AuthContext should pick up the change via onAuthStateChanged
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update display name.",
        variant: "destructive",
      });
      console.error("Error updating display name:", error);
    } finally {
      setIsSubmittingName(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !auth.currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
            title: "File Too Large",
            description: "Profile picture cannot exceed 5MB.",
            variant: "destructive",
        });
        return;
    }

    setIsUploadingImage(true);
    setLocalPhotoURL(URL.createObjectURL(file)); // Show local preview

    try {
      const filePath = `profileImages/${user.uid}/${file.name}`;
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setLocalPhotoURL(downloadURL); // Update with final URL
      toast({ title: "Profile Picture Updated", description: "Your new profile picture is set." });
      // AuthContext will update user object
    } catch (error: any) {
      setLocalPhotoURL(user.photoURL); // Revert to old image on error
      toast({
        title: "Image Upload Failed",
        description: error.message || "Could not upload new profile picture.",
        variant: "destructive",
      });
      console.error("Error uploading profile image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="relative group mb-6">
            <Avatar className="h-32 w-32 border-4 border-primary/50 group-hover:opacity-80 transition-opacity">
              <AvatarImage src={localPhotoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback className="text-4xl">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <Label
              htmlFor="profilePictureInput"
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Label>
            <Input
              id="profilePictureInput"
              type="file"
              accept="image/png, image/jpeg, image/gif"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploadingImage}
            />
          </div>
          <CardTitle className="text-3xl font-headline flex items-center">
            <UserCircle className="mr-3 h-8 w-8 text-primary" />
            Edit Profile
          </CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit(handleNameUpdate)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ""} readOnly disabled className="bg-muted/50"/>
              <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" {...register("displayName")} placeholder="Your Name" />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmittingName}>
              {isSubmittingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Edit3 className="mr-2 h-4 w-4" />
              Update Display Name
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
