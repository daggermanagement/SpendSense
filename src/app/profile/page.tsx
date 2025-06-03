
"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAlert } from "@/contexts/AlertContext";
import { Loader2, UserCircle, Camera, Save, DollarSign, ArrowLeft } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { COMMON_CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currencyUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allCategories, type ExpenseCategory, type UserBudget, type UserPreferences } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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

const MAX_FILE_SIZE_MB = 0.7; // Reduced to prevent Firestore 1MB field limit for Base64
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const FIRESTORE_STRING_FIELD_MAX_BYTES = 1048487; // Firestore's limit for a string field

export default function ProfilePage() {
  const { user, loading: authLoading, setUser, userPreferences, setUserPreferences } = useAuth();
  const { success, error, warning } = useAlert();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [localPhotoPreview, setLocalPhotoPreview] = React.useState<string | null | undefined>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      currency: userPreferences?.currency || DEFAULT_CURRENCY,
      budgets: allCategories.expense.map(cat => ({ category: cat as ExpenseCategory, amount: undefined })),
    }
  });
  const { handleSubmit, control, watch, formState: { errors }, setValue, reset } = form;

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      const currentBudgets = userPreferences?.budgets || {};
      reset({
        displayName: user.displayName || "",
        currency: userPreferences?.currency || DEFAULT_CURRENCY,
        budgets: allCategories.expense.map(cat => ({
          category: cat as ExpenseCategory,
          amount: currentBudgets[cat] || undefined,
        })),
      });
      setLocalPhotoPreview(userPreferences?.profileImageBase64 || user.photoURL || null);
    }
  }, [user, authLoading, userPreferences, router, reset]);


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

      success("Your display name, currency, and budgets have been updated.", "Profile Settings Updated");
    } catch (err: any) {
      error(err.message || "Could not update profile settings.", "Settings Update Failed");
      console.error("Error updating profile settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !auth.currentUser) return;
    const file = event.target.files?.[0];
    
    const currentTarget = event.currentTarget;

    if (!file) {
      if (currentTarget) (currentTarget as HTMLInputElement).value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      warning(`Profile picture file cannot exceed ${MAX_FILE_SIZE_MB}MB.`, "File Too Large");
      if (currentTarget) (currentTarget as HTMLInputElement).value = "";
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(30);
    };
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 50;
        setUploadProgress(30 + progress);
      }
    };
    reader.onloadend = async () => {
      const base64DataUri = reader.result as string;

      // Check if Base64 string exceeds Firestore's limit
      if (base64DataUri.length > FIRESTORE_STRING_FIELD_MAX_BYTES) {
        warning("The selected image, after encoding, is too large to store. Please choose a smaller file (approx. 0.7MB or less).", "Image Data Too Large For Storage");
        setIsUploadingImage(false);
        setUploadProgress(0);
        if (currentTarget) (currentTarget as HTMLInputElement).value = "";
        return;
      }
      
      setLocalPhotoPreview(base64DataUri); // Show preview immediately
      setUploadProgress(80);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const newPreferences: Partial<UserPreferences> = {
          profileImageBase64: base64DataUri,
        };
        await setDoc(userDocRef, newPreferences , { merge: true });

        if (setUserPreferences) {
          setUserPreferences(prev => ({ ...prev!, ...newPreferences }));
        }
        
        // Attempt to update Firebase Auth photoURL, but be mindful of its own limits for data URIs
        try {
          await updateProfile(auth.currentUser!, { photoURL: base64DataUri });
          if (setUser && auth.currentUser) {
            setUser(prevState => ({...prevState!, photoURL: auth.currentUser?.photoURL}));
          }
        } catch (authError: any) {
          console.warn("Failed to update Firebase Auth photoURL (might be too long or other issue):", authError.message);
          // Non-critical if this fails, Firestore is primary
        }
        
        setLocalPhotoPreview(base64DataUri); // Confirm local preview
        success("Your new profile picture is set.", "Profile Picture Updated");
        setUploadProgress(100);
      } catch (err: any) {
        setLocalPhotoPreview(userPreferences?.profileImageBase64 || user.photoURL || null); // Revert preview on error
        error(err.message || "Could not save new profile picture to Firestore.", "Image Update Failed");
        console.error("Error updating profile with new image:", err);
        setUploadProgress(0);
      } finally {
        setIsUploadingImage(false);
        if (currentTarget) (currentTarget as HTMLInputElement).value = ""; 
      }
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      setUploadProgress(0);
      error("Could not read the selected file.", "File Read Error");
      if (currentTarget) (currentTarget as HTMLInputElement).value = "";
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
  
  const currentCurrency = watch("currency") || userPreferences?.currency || DEFAULT_CURRENCY;

  return (
    <div className="container py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-auto"
            disabled={isSubmitting || isUploadingImage}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader className="items-center text-center">
            <div className="relative group mb-6">
              <Avatar key={localPhotoPreview || 'avatar-placeholder-key'} className="h-32 w-32 border-4 border-primary/50 group-hover:opacity-80 transition-opacity">
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
            <CardDescription>Update your display name, profile picture (max {MAX_FILE_SIZE_MB}MB file, smaller for storage), currency, and monthly budgets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
                <div className="space-y-2">
                  <FormLabel htmlFor="email">Email</FormLabel>
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
                      <Select onValueChange={field.onChange} value={field.value || userPreferences?.currency || DEFAULT_CURRENCY}>
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
                    {allCategories.expense.map((categoryName, index) => (
                       <FormField
                          key={categoryName}
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
          <CardFooter className="flex flex-col gap-4 pt-6">
            {/* Back button removed from here */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
    

      

    