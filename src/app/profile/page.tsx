
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
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = React.useState<string | null | undefined>(null); // For optimistic UI update
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);


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
      setLocalPhotoPreview(user.photoURL);
    }
  }, [user, authLoading, setValue, router]);

  const handleNameUpdate = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    setIsSubmittingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      if (setUser && auth.currentUser) {
        const updatedUserContext = { ...user, displayName: data.displayName };
        setUser(updatedUserContext); // Update context
      }
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
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

    const maxSize = 1 * 1024 * 1024; // 1MB limit
    if (file.size > maxSize) {
        toast({
            title: "File Too Large",
            description: `Profile picture cannot exceed ${maxSize / (1024 * 1024)}MB.`,
            variant: "destructive",
        });
        return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setLocalPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const storageRef = ref(storage, `profileImages/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsUploadingImage(false);
        setUploadProgress(null);
        setLocalPhotoPreview(user.photoURL); // Revert preview on error
        toast({
          title: "Upload Failed",
          description: error.message || "Could not upload image.",
          variant: "destructive",
        });
        console.error("Error uploading image:", error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateProfile(auth.currentUser!, { photoURL: downloadURL });

          if (setUser && auth.currentUser) {
             const updatedUserContext = { ...user, photoURL: downloadURL };
             setUser(updatedUserContext); // Update context
          }
          setLocalPhotoPreview(downloadURL); // Ensure preview is the final URL
          toast({ title: "Profile Picture Updated", description: "Your new profile picture is set." });
        } catch (error: any) {
          setLocalPhotoPreview(user.photoURL); // Revert preview on error
          toast({
            title: "Image Update Failed",
            description: error.message || "Could not save new profile picture URL.",
            variant: "destructive",
          });
          console.error("Error updating profile with new image URL:", error);
        } finally {
          setIsUploadingImage(false);
          setUploadProgress(null);
        }
      }
    );
  };

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
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
              <AvatarImage src={localPhotoPreview || undefined} alt={user.displayName || user.email || "User"} />
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
             {isUploadingImage && uploadProgress !== null && (
              <div className="absolute bottom-[-20px] left-0 right-0 px-2">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-headline flex items-center mt-4">
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
