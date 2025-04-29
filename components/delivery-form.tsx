"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Turnstile } from '@marsidev/react-turnstile'

const countryCodes = [
  { value: "+33", label: "France (+33)" },
  { value: "+32", label: "Belgique (+32)" },
  { value: "+49", label: "Allemagne (+49)" },
  { value: "+31", label: "Pays-Bas (+31)" },
]

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  countryCode: z.string(),
  phone: z.string().min(5, "Numéro de téléphone trop court").max(10, "Numéro de téléphone trop long (max 10 chiffres)"),
  country: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  message: z.string().optional(),
})

interface DeliveryFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (data: z.infer<typeof formSchema> & { turnstileToken: string }) => void
  isSubmitting?: boolean
}

// Country selector bileşeni için SelectContent'i özelleştiriyorum
const CustomSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  React.ComponentPropsWithoutRef<typeof SelectContent>
>(({ className, ...props }, ref) => (
  <SelectContent 
    ref={ref} 
    className={cn("z-[99999]", className)} 
    {...props} 
  />
));
CustomSelectContent.displayName = "CustomSelectContent";

export function DeliveryForm({ open, onOpenChange, onSubmit, isSubmitting = false }: DeliveryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+33",
      phone: "",
      country: "",
      city: "",
      postalCode: "",
      address: "",
      message: ""
    },
  })
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Conditionally render Dialog based on whether open/onOpenChange are provided
  const DialogWrapper = open !== undefined && onOpenChange !== undefined ? Dialog : React.Fragment;
  const dialogProps = open !== undefined && onOpenChange !== undefined ? { open, onOpenChange } : {};

  const handleLocalSubmit = (data: z.infer<typeof formSchema>) => {
    if (!turnstileToken) {
      form.setError("root.serverError", { 
        type: "manual",
        message: "Veuillez compléter la vérification CAPTCHA."
      });
      return; 
    }
    onSubmit({ ...data, turnstileToken });
  };

  return (
    <DialogWrapper {...dialogProps}>
      {/* Conditionally render DialogContent only if it's used as a Dialog */}
      {(open !== undefined && onOpenChange !== undefined) ? (
        <DialogContent className="sm:max-w-[500px] z-[99999]">
          <DialogHeader className="bg-white pt-6 px-6 -mx-6 -mt-6 mb-4">
            <DialogTitle>Informations de livraison</DialogTitle>
            <DialogDescription>
              Veuillez remplir les informations de livraison ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-4">
              {/* Zorunlu alanlar */}
              <div className="space-y-4 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Pays *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <CustomSelectContent>
                            {countryCodes.map((code) => (
                              <SelectItem key={code.value} value={code.value}>
                                {code.label}
                              </SelectItem>
                            ))}
                          </CustomSelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={10} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Diğer alanlar */}
              <div className="space-y-4">              
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Postal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Si vous désirez une quantité différente que celle du produit affiché ou être livré à domicile, n'hésitez pas à le préciser ici." 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Turnstile Widget */}
              <div className="pt-4 border-t">
                <Turnstile 
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                  onSuccess={(token: string) => {
                     console.log("Turnstile Token Alındı (DeliveryForm):", token);
                     setTurnstileToken(token);
                     form.clearErrors("root.serverError");
                  }}
                  onError={() => {
                    console.error("Turnstile Hatası (DeliveryForm)");
                    form.setError("root.serverError", { type: "manual", message: "Erreur de vérification CAPTCHA." });
                  }}
                   onExpire={() => {
                     console.warn("Turnstile Süresi Doldu (DeliveryForm)");
                     form.setError("root.serverError", { type: "manual", message: "Vérification CAPTCHA expirée." });
                     setTurnstileToken(null); 
                   }}
                  options={{
                    theme: 'light',
                  }}
                />
                {form.formState.errors.root?.serverError && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.root.serverError.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Confirmer la commande"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      ) : (
        // Render only the form if not used as a Dialog
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-4">
            {/* Zorunlu alanlar */}
            <div className="space-y-4 pb-4 border-b">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Pays *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <CustomSelectContent>
                          {countryCodes.map((code) => (
                            <SelectItem key={code.value} value={code.value}>
                              {code.label}
                            </SelectItem>
                          ))}
                        </CustomSelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Diğer alanlar */}
            <div className="space-y-4">              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Postal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Turnstile Widget */}
            <div className="pt-4 border-t">
              <Turnstile 
                siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                onSuccess={(token: string) => {
                   console.log("Turnstile Token Alındı (DeliveryForm):", token);
                   setTurnstileToken(token);
                   form.clearErrors("root.serverError");
                }}
                onError={() => {
                  console.error("Turnstile Hatası (DeliveryForm)");
                  form.setError("root.serverError", { type: "manual", message: "Erreur de vérification CAPTCHA." });
                }}
                 onExpire={() => {
                   console.warn("Turnstile Süresi Doldu (DeliveryForm)");
                   form.setError("root.serverError", { type: "manual", message: "Vérification CAPTCHA expirée." });
                   setTurnstileToken(null); 
                 }}
                options={{
                  theme: 'light',
                }}
              />
              {form.formState.errors.root?.serverError && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.root.serverError.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer la commande"}
            </Button>
          </form>
        </Form>
      )}
    </DialogWrapper>
  )
} 
