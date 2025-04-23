"use client"

import type React from "react"
import { useState, useCallback, memo, Suspense, useEffect } from "react"
import { Phone, Mail, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

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

export default function ContactPage() {
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

  // Sayfa yüklendikten sonra animasyonları etkinleştir
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus('idle')
    setErrorMessage("")
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }
      
      // Mesaj başarıyla gönderildi
      setSubmitStatus('success')
      // Formu temizle
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }, [formData])

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
              icon={Phone}
              title="Téléphone"
              content="056 55 66 15"
            />
            <ContactCard
              icon={Mail}
              title="Email"
              content="infos@philippeprimeurs.be"
            />
            <ContactCard
              icon={MapPin}
              title="Adresse"
              content="Rue de la Broche de Fer 263, 7712 Mouscron"
            />
          </div>

          <Suspense fallback={<div className="mt-8 h-[300px] bg-gray-100 rounded-lg animate-pulse" />}>
            <Map />
          </Suspense>
        </div>

        {/* Sağ Taraf - İletişim Formu */}
        <div className={`opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
          <h2 className="text-2xl font-semibold mb-6 text-secondary">Envoyez-nous un message</h2>
          
          {submitStatus === 'success' ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Message envoyé avec succès!</h3>
              <p>Nous vous répondrons dans les plus brefs délais.</p>
              <Button 
                onClick={() => setSubmitStatus('idle')} 
                variant="outline" 
                className="mt-4"
              >
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="font-semibold">Erreur:</p>
                  <p>{errorMessage}</p>
                </div>
              )}
              
              <FormInput
                id="name"
                label="Nom complet"
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Envoyer le message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

