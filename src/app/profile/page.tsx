
"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle, Camera, Save } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { COMMON_CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currencyUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
  currency: z.custom<CurrencyCode>(val => COMMON_CURRENCIES.some(c => c.code === val), {
    message: "Invalid currency selected.",
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100KB limit for Base64 in Firestore

export default function ProfilePage() {
  const { user, loading: authLoading, setUser, userPreferences, setUserPreferences } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = React.useState<string | null | undefined>(null);
  
  const {
    register,
    handleSubmit,
    setValue: setFormValue,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      currency: userPreferences?.currency || DEFAULT_CURRENCY,
    }
  });

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setFormValue("displayName", user.displayName || "");
    }
    if (userPreferences) {
        setFormValue("currency", userPreferences.currency || DEFAULT_CURRENCY);
        // Prioritize Firestore image for preview, then Auth photoURL
        setLocalPhotoPreview(userPreferences.profileImageBase64 || user?.photoURL || null);
    } else if (user) {
        setLocalPhotoPreview(user.photoURL || null);
    }

  }, [user, authLoading, setFormValue, router, userPreferences]);

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      if (data.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
        if (setUser && auth.currentUser) {
          const updatedUserContext = { ...user, displayName: auth.currentUser.displayName };
          setUser(updatedUserContext);
        }
      }

      if (data.currency && data.currency !== (userPreferences?.currency || DEFAULT_CURRENCY)) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { currency: data.currency }, { merge: true });
        if (setUserPreferences) {
          setUserPreferences(prev => ({ ...prev!, currency: data.currency! }));
        }
      }
      toast({ title: "Profile Updated", description: "Your profile settings have been updated." });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile settings.",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
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
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64DataUri = reader.result as string;
      setLocalPhotoPreview(base64DataUri); 

      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { profileImageBase64: base64DataUri }, { merge: true });

        if (setUserPreferences) {
            setUserPreferences(prev => ({ ...prev!, profileImageBase64: base64DataUri }));
        }
        
        try {
            await updateProfile(auth.currentUser!, { photoURL: base64DataUri });
             if (setUser && auth.currentUser) {
               setUser(prevState => ({...prevState!, photoURL: base64DataUri}));
            }
        } catch (authError: any) {
            console.warn("Firebase Auth photoURL update failed (might be too long):", authError.message);
            toast({
                title: "Image Stored in DB",
                description: "Profile picture saved to database. Auth photoURL update might have limits.",
                variant: "default",
            });
        }
        
        toast({ title: "Profile Picture Updated", description: "Your new profile picture is set." });

      } catch (error: any) {
        // Revert preview if Firestore save fails
        setLocalPhotoPreview(userPreferences?.profileImageBase64 || user.photoURL || null); 
        toast({
          title: "Image Update Failed",
          description: error.message || "Could not save new profile picture.",
          variant: "destructive",
        });
        console.error("Error updating profile with new image:", error);
      } finally {
        setIsUploadingImage(false);
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
          </div>
          <CardTitle className="text-3xl font-headline flex items-center mt-4">
            <UserCircle className="mr-3 h-8 w-8 text-primary" />
            Edit Profile
          </CardTitle>
          <CardDescription>Update your display name, profile picture (max {MAX_FILE_SIZE_BYTES/1024}KB), and currency preference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
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
            
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Controller
                name="currency"
                control={control}
                defaultValue={userPreferences?.currency || DEFAULT_CURRENCY}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting || isUploadingImage}>
              {(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Profile Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
