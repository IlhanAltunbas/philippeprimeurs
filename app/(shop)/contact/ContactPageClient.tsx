"use client"

import type React from "react"
import { useState, useCallback, memo, Suspense, useEffect } from "react"
import { Phone, Mail, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Turnstile } from '@marsidev/react-turnstile';

// Memoized contact card component
const ContactCard = memo(({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-gray-600">{content}</p>
      </div>
    </CardContent>
  </Card>
))

ContactCard.displayName = 'ContactCard'

// Memoized form input component
const FormInput = memo(({ 
  id, 
  label, 
  type = "text", 
  value, 
  onChange, 
  required = true,
  textarea = false 
}: { 
  id: string; 
  label: string; 
  type?: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
  required?: boolean;
  textarea?: boolean;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    {textarea ? (
      <Textarea
        id={id}
        value={value}
        onChange={onChange}
        className="min-h-[150px]"
        required={required}
      />
    ) : (
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    )}
  </div>
))

FormInput.displayName = 'FormInput'

// Iframe tabanlı Google Maps bileşeni - sadece başlık çubuğunu gizleyen versiyon
const SimpleMap = memo(() => (
  <div className="mt-8 h-[300px] rounded-lg overflow-hidden relative">
    <div 
      className="absolute inset-0 overflow-hidden"
      style={{ 
        height: '120%',  // Biraz daha yüksek bir iframe 
        marginTop: '-60px', // Başlık çubuğunu tamamen kırpmak için
      }}
    >
      <iframe 
        src="https://www.google.com/maps/d/u/1/embed?mid=1hSk318NamxxEUMSE11njru_PESEPGMk&ehbc=2E312F&noprof=1&ui=simplified" 
        width="100%" 
        height="100%" 
        style={{ border: 0 }}
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title="Philippe Primeurs Harita"
      ></iframe>
    </div>
  </div>
))

SimpleMap.displayName = 'SimpleMap'

// Google Maps API bileşeni - bu bileşen, API anahtarı eklendiğinde alternatif olarak kullanılabilir
// Not: Kullanmak için @react-google-maps/api paketini yüklemelisiniz
// npm install @react-google-maps/api
function GoogleMapComponent() {
  const [GoogleMap, setGoogleMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Dinamik import ile Google Maps API'sini yüklüyoruz
    import('@react-google-maps/api').then(module => {
      setGoogleMap({
        LoadScript: module.LoadScript,
        GoogleMap: module.GoogleMap,
        Marker: module.MarkerF
      });
      setIsLoaded(true);
    }).catch(err => {
      console.error('Google Maps API yüklenirken hata oluştu:', err);
      setLoadError(true);
    });
  }, []);

  // Mağazanın konumu - doğru koordinatlarla güncelleyiniz
  const center = { lat: 50.7456, lng: 3.2158 }; // Mouscron, Belçika

  if (loadError) {
    return <SimpleMap />;
  }

  if (!isLoaded || !GoogleMap) {
    return <div className="mt-8 h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>;
  }

  const { LoadScript, GoogleMap: GoogleMapComponent, Marker } = GoogleMap;

  // API_KEY değişkenini .env.local dosyasında tanımlayın
  // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!API_KEY || API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    // Hata mesajını göstermek yerine SimpleMap bileşenini kullanıyoruz
    return <SimpleMap />;
  }

  return (
    <div className="mt-8 h-[300px]">
      <LoadScript googleMapsApiKey={API_KEY}>
        <GoogleMapComponent
          mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
          }}
        >
          <Marker position={center} />
        </GoogleMapComponent>
      </LoadScript>
    </div>
  );
}

// Ana harita bileşeni - Eğer API anahtarı tanımlanırsa, GoogleMapComponent kullanır
// Tanımlanmazsa SimpleMap'e geri döner
const Map = memo(() => {
  // Hata mesajını göstermemek için Google Maps API'sini devre dışı bırakıyoruz
  const USE_GOOGLE_MAPS_API = false;

  if (USE_GOOGLE_MAPS_API) {
    return <GoogleMapComponent />;
  }

  return <SimpleMap />;
})

Map.displayName = 'Map'

export default function ContactPageClient() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Sayfa yüklendikten sonra animasyonları etkinleştir
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Turnstile token kontrolü
    if (!turnstileToken) {
      setErrorMessage("Veuillez compléter la vérification CAPTCHA.");
      setSubmitStatus('error');
      return;
    }

    setIsLoading(true)
    setSubmitStatus('idle')
    setErrorMessage("")
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, turnstileToken }), // Token eklendi
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }
      
      setSubmitStatus('success')
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTurnstileToken(null); // Token sıfırlama eklendi
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }, [formData, turnstileToken]) // turnstileToken bağımlılıklara eklendi

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }, [])

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12 text-secondary">
        Contactez-nous
      </h1>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Sol Taraf - İletişim Bilgileri */}
        <div className={`space-y-6 opacity-0 translate-y-4 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
          <h2 className="text-2xl font-semibold mb-6 text-secondary">Nos Coordonnées</h2>
          <div className="space-y-6">
            <ContactCard
              icon={MapPin}
              title="Adresse"
              content="Rue de la Broche de Fer 263, 7712 Mouscron"
            />
            <ContactCard
              icon={Phone}
              title="Téléphone"
              content="+32 56 55 66 15"
            />
            <ContactCard
              icon={Mail}
              title="Email"
              content="infos@philippeprimeurs.be"
            />
          </div>

          {/* Harita - Client Component'te render edilebilir */}
          <Suspense fallback={<div>Chargement de la carte...</div>}>
            <Map />
          </Suspense>
        </div>

        {/* Sağ Taraf - İletişim Formu */}
        <div className={`space-y-6 opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
          <h2 className="text-2xl font-semibold mb-6 text-secondary">Envoyez-nous un message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput 
              id="name" 
              label="Nom" 
              value={formData.name} 
              onChange={handleInputChange} 
            />
            <FormInput 
              id="email" 
              label="Email" 
              type="email" 
              value={formData.email} 
              onChange={handleInputChange} 
            />
            <FormInput 
              id="subject" 
              label="Sujet" 
              value={formData.subject} 
              onChange={handleInputChange} 
            />
            <FormInput 
              id="message" 
              label="Message" 
              value={formData.message} 
              onChange={handleInputChange} 
              textarea 
            />

            {/* Turnstile Widget */}
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
              onSuccess={(token: string) => {
                console.log("Turnstile Token Alındı Client:", token);
                setTurnstileToken(token);
              }}
              onError={() => {
                console.error("Turnstile Hatası Client");
                setErrorMessage("Erreur de vérification CAPTCHA. Veuillez réessayer.");
                setSubmitStatus('error');
              }}
              onExpire={() => {
                console.warn("Turnstile Süresi Doldu Client");
                setErrorMessage("La vérification CAPTCHA a expiré. Veuillez réessayer.");
                setSubmitStatus('error');
                setTurnstileToken(null);
              }}
              options={{
                theme: 'light',
              }}
            />

            <Button type="submit" disabled={isLoading || submitStatus === 'success'} className="w-full flex items-center gap-2">
              {isLoading ? "Envoi en cours..." : (submitStatus === 'success' ? <><Send size={18} /> Message Envoyé!</> : <><Send size={18} /> Envoyer le Message</>)}
            </Button>

            {submitStatus === 'error' && (
              <p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                Erreur: {errorMessage || 'Impossible d\'envoyer le message.'}
              </p>
            )}
            {/* Başarı mesajı eklendi */}
            {submitStatus === 'success' && (
              <p className="text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                Votre message a été envoyé avec succès !
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
} 