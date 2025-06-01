
"use client";

import * as React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle, Camera, Save, Trash2, DollarSign } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase"; // Added storage
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"; // Added storage functions
import { useRouter } from "next/navigation";
import { COMMON_CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode, formatCurrency } from "@/lib/currencyUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allCategories, type ExpenseCategory, type UserBudget } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress"; // Added Progress

const budgetEntrySchema = z.object({
  category: z.custom<ExpenseCategory>(),
  amount: z.coerce.number().nonnegative({ message: "Budget amount must be non-negative."}).optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }),
  currency: z.custom<CurrencyCode>(val => COMMON_CURRENCIES.some(c => c.code === val), {
    message: "Invalid currency selected.",
  }).optional(),
  budgets: z.array(budgetEntrySchema).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfilePage() {
  const { user, loading: authLoading, setUser, userPreferences, setUserPreferences } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [localPhotoPreview, setLocalPhotoPreview] = React.useState<string | null | undefined>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      currency: DEFAULT_CURRENCY,
      budgets: allCategories.expense.map(cat => ({ category: cat as ExpenseCategory, amount: undefined })),
    }
  });
  const { handleSubmit, control, watch, formState: { errors }, setValue } = form;

  const { fields } = useFieldArray({
    control,
    name: "budgets",
  });

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setValue("displayName", user.displayName || "");
      setLocalPhotoPreview(user.photoURL || null); // Initialize with current auth photoURL
    }
    if (userPreferences) {
      setValue("currency", userPreferences.currency || DEFAULT_CURRENCY);
      // Prefer Firestore image if available, else Auth photoURL
      setLocalPhotoPreview(userPreferences.profileImageBase64 || user?.photoURL || null);
      
      const existingBudgetsArray = allCategories.expense.map(cat => ({
        category: cat as ExpenseCategory,
        amount: userPreferences.budgets?.[cat] || undefined,
      }));
      setValue("budgets", existingBudgetsArray);
    }

  }, [user, authLoading, setValue, router, userPreferences]);


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

      const userDocRef = doc(db, "users", user.uid);
      const updates: Partial<UserPreferences> = {};

      if (data.currency && data.currency !== (userPreferences?.currency || DEFAULT_CURRENCY)) {
        updates.currency = data.currency;
      }

      if (data.budgets) {
        const newBudgetsMap: UserBudget = {};
        data.budgets.forEach(budgetEntry => {
          if (budgetEntry.category && budgetEntry.amount !== undefined && budgetEntry.amount > 0) {
            newBudgetsMap[budgetEntry.category] = budgetEntry.amount;
          }
        });
        updates.budgets = newBudgetsMap;
      }
      
      if (Object.keys(updates).length > 0) {
         await setDoc(userDocRef, updates, { merge: true });
         if (setUserPreferences) {
           setUserPreferences(prev => ({ ...prev!, ...updates }));
         }
      }

      toast({ title: "Profile Settings Updated", description: "Your display name, currency, and budgets have been updated." });
    } catch (error: any) {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Could not update profile settings.",
        variant: "destructive",
      });
      console.error("Error updating profile settings:", error);
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
        description: `Profile picture cannot exceed ${MAX_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);
    
    // For immediate preview before upload completes
    const reader = new FileReader();
    reader.onload = (e) => setLocalPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const oldPhotoPath = userPreferences?.profileImageStoragePath;

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
        setUploadProgress(0);
        setLocalPhotoPreview(userPreferences?.profileImageBase64 || user.photoURL || null); // Revert preview
        toast({
          title: "Upload Failed",
          description: error.message || "Could not upload profile picture.",
          variant: "destructive",
        });
        console.error("Error uploading image:", error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Firebase Auth profile
          await updateProfile(auth.currentUser!, { photoURL: downloadURL });

          // Update Firestore document
          const userDocRef = doc(db, "users", user.uid);
          const newPreferences: Partial<UserPreferences> = { 
            profileImageBase64: downloadURL, // Storing URL from storage, not base64
            profileImageStoragePath: uploadTask.snapshot.ref.fullPath // Store path for deletion
          };
          await setDoc(userDocRef, newPreferences , { merge: true });

          // Update local context
          if (setUserPreferences) {
            setUserPreferences(prev => ({ ...prev!, ...newPreferences }));
          }
           if (setUser && auth.currentUser) {
            setUser(prevState => ({...prevState!, photoURL: downloadURL}));
          }
          setLocalPhotoPreview(downloadURL); // Update preview with final URL

          // Delete old image from storage if it exists and is different
          if (oldPhotoPath && oldPhotoPath !== uploadTask.snapshot.ref.fullPath) {
            try {
              const oldImageRef = ref(storage, oldPhotoPath);
              await deleteObject(oldImageRef);
            } catch (deleteError) {
              console.warn("Could not delete old profile image:", deleteError);
            }
          }

          toast({ title: "Profile Picture Updated", description: "Your new profile picture is set." });
        } catch (error: any) {
          setLocalPhotoPreview(userPreferences?.profileImageBase64 || user.photoURL || null); // Revert preview
          toast({
            title: "Image Update Failed",
            description: error.message || "Could not save new profile picture.",
            variant: "destructive",
          });
          console.error("Error updating profile with new image:", error);
        } finally {
          setIsUploadingImage(false);
          setUploadProgress(0);
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
  
  const currentCurrency = watch("currency") || DEFAULT_CURRENCY;

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
              disabled={isUploadingImage || isSubmitting}
            />
          </div>
          {isUploadingImage && <Progress value={uploadProgress} className="w-3/4 mx-auto h-2 my-2" />}
          <CardTitle className="text-3xl font-headline flex items-center mt-4">
            <UserCircle className="mr-3 h-8 w-8 text-primary" />
            Edit Profile
          </CardTitle>
          <CardDescription>Update your display name, profile picture (max {MAX_FILE_SIZE_MB}MB), currency, and monthly budgets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ""} readOnly disabled className="bg-muted/50"/>
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>
              
              <FormField
                control={control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-xl font-headline flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  Monthly Budgets (Expenses)
                </h3>
                <CardDescription>Set your target spending for each expense category. Leave blank or 0 if no budget.</CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {fields.map((item, index) => (
                     <FormField
                        key={item.id}
                        control={control}
                        name={`budgets.${index}.amount`}
                        render={({ field: { onChange, value, ...restField } }) => (
                          <FormItem>
                            <FormLabel>{watch(`budgets.${index}.category`)} ({currentCurrency})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                {...restField}
                                value={value === undefined ? '' : String(value)}
                                onChange={(e) => {
                                    const numVal = parseFloat(e.target.value);
                                    onChange(isNaN(numVal) ? undefined : numVal);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-8" disabled={isSubmitting || isUploadingImage}>
                {(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Profile Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    