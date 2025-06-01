
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
import { auth, db } from "@/lib/firebase"; // Removed storage import
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Max original file size: 100KB. Base64 will be ~133KB.
const MAX_FILE_SIZE_BYTES = 100 * 1024; 

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = React.useState<string | null | undefined>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null); // Kept for UI consistency, but won't show real progress for Base64

  const {
    register,
    handleSubmit,
    setValue: setFormValue, // Renamed to avoid conflict
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setFormValue("displayName", user.displayName || "");
      // Attempt to load from Firestore first, then Auth photoURL
      const loadProfileImage = async () => {
        if (user.uid) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.profileImageBase64) {
                setLocalPhotoPreview(data.profileImageBase64);
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching profile image from Firestore:", error);
          }
        }
        setLocalPhotoPreview(user.photoURL); // Fallback to auth photoURL
      };
      loadProfileImage();
    }
  }, [user, authLoading, setFormValue, router]);

  const handleNameUpdate = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    setIsSubmittingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      if (setUser && auth.currentUser) {
        // Create a new user object for the context to ensure re-render
        const updatedUserContext = { 
          ...user, 
          displayName: auth.currentUser.displayName 
        };
        setUser(updatedUserContext);
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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `Profile picture cannot exceed ${MAX_FILE_SIZE_BYTES / 1024}KB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(50); // Mock progress as conversion is fast

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64DataUri = reader.result as string;
      setLocalPhotoPreview(base64DataUri); // Optimistic UI update

      try {
        // Save to Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { profileImageBase64: base64DataUri }, { merge: true });

        // Attempt to save to Firebase Auth photoURL
        try {
            await updateProfile(auth.currentUser!, { photoURL: base64DataUri });
        } catch (authError: any) {
            console.warn("Firebase Auth photoURL update failed (might be too long):", authError.message);
            toast({
                title: "Image Stored in DB",
                description: "Profile picture saved. Display in some areas might rely on browser cache or direct DB read if Auth update failed.",
                variant: "default",
            });
        }

        if (setUser && auth.currentUser) {
          // Create a new user object for the context to ensure re-render
          const updatedUserContext = { 
            ...user, 
            photoURL: auth.currentUser.photoURL, // This will be the (potentially failed) auth version
            // To truly reflect Firestore, context would need a way to store/fetch profileImageBase64
          };
           setUser(prevState => ({...prevState!, photoURL: base64DataUri}));
        }
        setLocalPhotoPreview(base64DataUri);
        toast({ title: "Profile Picture Updated", description: "Your new profile picture is set." });

      } catch (error: any) {
        setLocalPhotoPreview(user.photoURL); // Revert preview on error
        toast({
          title: "Image Update Failed",
          description: error.message || "Could not save new profile picture.",
          variant: "destructive",
        });
        console.error("Error updating profile with new image:", error);
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(null);
      }
    };
    reader.readAsDataURL(file);
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
          <CardDescription>Update your display name and profile picture. Max image size: ${MAX_FILE_SIZE_BYTES / 1024}KB.</CardDescription>
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

