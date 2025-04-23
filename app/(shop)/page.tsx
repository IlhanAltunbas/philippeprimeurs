"use client"

// Statik derleme için yapılandırma
export const dynamic = 'force-static'

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { API_BASE_URL } from "@/lib/api-config"
import { useCart } from "@/lib/cart"
import {
  ShoppingBag,
  Truck,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Users,
  Car,
  Clock,
  Leaf,
  Shield,
  Apple,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductCard from "@/components/product-card"
import Link from "next/link"

// Product tipini tanımla
interface Product {
  id: number
  name: string
  price: number
  category?: {
    id: number
    name: string
  }
  quantity: number
  unit: string
  origin: string
  image?: string
  description?: string
  isActive: boolean
  isComposite?: boolean
  contents?: Array<{
    name: string
    quantity: string
    origin: string
  }>
}

const reviews = [
  {
    name: "Marie L.",
    rating: 5,
    comment:
      "Client fidèle depuis des années, je suis toujours satisfait. La qualité des produits est constante et le service impeccable.",
    image: "/comments/comment1.webp"
  },
  {
    name: "Sophie L.",
    rating: 5,
    comment:
      "Excellente sélection de produits bio et locaux. J'apprécie leur collaboration avec les agriculteurs locaux. Les légumes sont toujours frais.",
    image: "/comments/comment2.webp"
  },
  {
    name: "Thomas B.",
    rating: 5,
    comment:
      "Le service de livraison à domicile est une vraie révolution pour moi. En tant que personne à mobilité réduite, c'est un grand soulagement.",
    image: "/comments/comment3.webp"
  }
]

const bannerSlides = [
  {
    image: "/banners/banner1.webp",
    title: "Des Produits Frais Chaque Jour",
    subtitle: "Découvrez notre sélection de fruits et légumes locaux",
  },
  {
    image: "/banners/banner2.webp",
    title: "Qualité et Fraîcheur Garanties",
    subtitle: "Des produits soigneusement sélectionnés pour votre bien-être",
  },
  {
    image: "/banners/banner3.webp",
    title: "Du Producteur à Votre Table",
    subtitle: "Soutenez l'agriculture locale avec nos produits de saison",
  },
]

const categories = [
  {
    name: "Fruits",
    image: "/categories/fruits.webp",
    desc: "Fruits frais de saison",
  },
  {
    name: "Légumes",
    image: "/categories/legumes.webp",
    desc: "Légumes frais du jour",
  },
  {
    name: "Colis",
    image: "/categories/colis.webp",
    desc: "Colis de produits préparés",
  },
  {
    name: "Fait maison",
    image: "/categories/fait-maison.webp",
    desc: "Produits artisanaux faits maison",
  },
  {
    name: "Paniers",
    image: "/categories/paniers.webp",
    desc: "Paniers de produits assortis",
  },
  {
    name: "Tous les produits",
    image: "/categories/tous-produits.webp",
    desc: "Explorez notre gamme complète de produits frais",
  },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentReview, setCurrentReview] = useState(0)
  const router = useRouter()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const { isOpen, setIsOpen } = useCart()

  const deliverySectionRef = useRef(null)
  const isDeliverySectionInView = useInView(deliverySectionRef, { once: true, amount: 0.3 })

  const openingHoursSectionRef = useRef(null)
  const isOpeningHoursSectionInView = useInView(openingHoursSectionRef, { once: true, amount: 0.3 })

  const heroSectionRef = useRef<HTMLElement>(null)
  
  // Banner boyutunun ilk yüklemede ve pencere boyutu değiştiğinde ayarlanması
  useEffect(() => {
    const updateHeroHeight = () => {
      if (heroSectionRef.current) {
        // Sayfa ilk açıldığında tam header boyutuyla (180px) hesapla
        const windowHeight = window.innerHeight
        heroSectionRef.current.style.height = `${windowHeight - 180}px`
      }
    }
    
    // İlk yükleme
    updateHeroHeight()
    
    // Pencere boyutu değiştiğinde de sabit header boyutuyla hesapla
    window.addEventListener('resize', updateHeroHeight)
    
    // Header boyutu değiştiğinde boyutu değiştirme
    const handleHeaderSizeChange = (e: Event) => {
      // Artık header değiştiğinde banner boyutunu değiştirmiyoruz
      // Böylece banner sabit kalıyor
    }
    
    window.addEventListener('headerSizeChange', handleHeaderSizeChange)
    
    return () => {
      window.removeEventListener('resize', updateHeroHeight)
      window.removeEventListener('headerSizeChange', handleHeaderSizeChange)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      document.body.classList.toggle("scrolled", window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % bannerSlides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prevReview) => (prevReview + 1) % reviews.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        // Créer l'URL
        const url = new URL('/api/featured-products', window.location.origin)
        
        // Ajouter un timestamp pour contourner le cache
        url.searchParams.append('_', Date.now().toString())

        // Récupération des données avec désactivation du cache
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Timestamp': Date.now().toString()
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          console.error("Erreur API produits en vedette:", response.statusText);
          throw new Error("Impossible de charger les produits en vedette");
        }
        
        // Traitement des données selon la même structure que l'API produits
        const data = await response.json();
        
        // L'API renvoie maintenant les produits sous la clé 'products'
        const productsData = data.products || [];
        
        const transformedProducts = productsData.map((productData: any) => ({
          id: productData.id,
          name: productData.name,
          price: Number(productData.price || 0),
          category: productData.category,
          quantity: Number(productData.quantity || 0),
          unit: productData.unit,
          origin: productData.origin,
          isActive: productData.is_active,
          description: productData.description,
          image: productData.image,
          contents: productData.contents,
          isComposite: productData.is_composite
        }));

        setFeaturedProducts(transformedProducts);
      } catch (error) {
        console.error("Erreur lors du chargement des produits en vedette:", error);
      }
    }
    
    // Chargement initial
    fetchFeaturedProducts();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchFeaturedProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? bannerSlides.length - 1 : prevSlide - 1))
  }

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % bannerSlides.length)
  }

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        className="relative w-full vh-minus-header"
      >
        {bannerSlides.map((slide, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: currentSlide === index ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4">
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-center leading-tight"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {slide.title}
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl lg:text-3xl mb-8 text-center max-w-3xl"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {slide.subtitle}
              </motion.p>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <Button
                  onClick={() => router.push("/products")}
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white"
                >
                  Découvrir nos produits
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ))}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {bannerSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index ? "bg-white scale-125" : "bg-white/50"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 transition-all duration-300 z-20"
          onClick={prevSlide}
        >
          <ChevronLeft size={32} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 transition-all duration-300 z-20"
          onClick={nextSlide}
        >
          <ChevronRight size={32} />
        </Button>
      </section>

      {/* Welcome Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              Bienvenue chez Philippe Primeurs by Fauve
            </h2>
            <p className="text-xl text-gray-700 mb-12 leading-relaxed">
              Découvrez l'excellence de nos produits locaux, soigneusement sélectionnés pour vous offrir une expérience
              gustative exceptionnelle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: Leaf,
                  title: "Fraîcheur Garantie",
                  description: "Des produits frais livrés quotidiennement pour garantir une qualité optimale.",
                },
                {
                  icon: Users,
                  title: "Service Personnalisé",
                  description: "Une équipe dévouée pour vous conseiller et vous accompagner dans vos choix.",
                },
                {
                  icon: Shield,
                  title: "Fiabilité",
                  description:
                    "Nous accordons toujours la priorité à la satisfaction du client et à la qualité des produits.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -10 }}
                  className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div className="bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-secondary">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-4 text-center text-secondary">Nos Catégories</h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Explorez notre large gamme de produits frais et de qualité.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-xl shadow-lg group w-full aspect-[3/2]"
              >
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 25vw"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {category.desc}
                  </p>
                  <Link
                    href={category.name === "Tous les produits" ? "/products" : `/products?category=${category.name}`}
                    className="inline-flex items-center text-sm font-medium text-white hover:underline"
                  >
                    Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Service de Livraison */}
      <section ref={deliverySectionRef} className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center text-secondary">Notre Service de Livraison</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              className="bg-white text-secondary p-8 rounded-xl shadow-lg"
              initial={{ opacity: 0, x: -100 }}
              animate={isDeliverySectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-primary mb-6">Livraison à Domicile</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <Truck className="w-6 h-6 mr-4 text-primary" />
                  <span>Herseaux et ses alentours</span>
                </li>
                <li className="flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-4 text-primary" />
                  <span>Livraison gratuite à partir de 20 €</span>
                </li>
                <li className="flex items-center">
                  <Users className="w-6 h-6 mr-4 text-primary" />
                  <span>Pour les personnes à mobilité réduite</span>
                </li>
                <li className="flex items-center">
                  <Car className="w-6 h-6 mr-4 text-primary" />
                  <span>Pour ceux qui n'ont pas de véhicule</span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              className="relative overflow-hidden rounded-xl shadow-lg w-full aspect-[16/9] bg-gray-50 flex items-center justify-center"
              initial={{ opacity: 0, x: 100 }}
              animate={isDeliverySectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <Image
                src="/store/delivery.webp"
                alt="Service de livraison"
                width={800}
                height={450}
                className="max-w-full h-auto object-contain rounded-md"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 50vw"
                loading="eager"
                priority
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <AnimatedSection>
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4 text-center text-secondary">Produits Vedettes</h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              Découvrez nos produits les plus populaires, soigneusement sélectionnés pour leur qualité exceptionnelle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full mx-auto"
                >
                  <ProductCard
                    id={product.id.toString()}
                    name={product.name}
                    price={product.price}
                    image={product.image || "/placeholder.svg"}
                    type={product.category?.name}
                    quantity={`${product.quantity} ${product.unit}`}
                    origin={product.origin}
                    contents={product.contents}
                  />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-secondary text-white hover:bg-secondary-dark shadow-md hover:shadow-lg transform hover:-translate-y-1 px-8 py-3 group"
              >
                <span>Voir tous les produits</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Customer Reviews */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4 text-center text-secondary">Ce Que Disent Nos Clients</h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Nous sommes fiers de la satisfaction de nos clients. Voici ce qu'ils pensent de nos produits et services.
          </p>
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentReview}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ 
                  duration: 0.3,
                  type: "tween",
                }}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full" />
                    <Image
                      src={reviews[currentReview].image}
                      alt={reviews[currentReview].name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full ring-4 ring-primary/20"
                    />
                  </div>
                  <p className="text-lg italic text-gray-700 mb-6 relative">
                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10">"</span>
                    {reviews[currentReview].comment}
                    <span className="absolute -bottom-4 -right-2 text-6xl text-primary/10">"</span>
                  </p>
                  <div className="flex items-center mt-4">
                    <div className="flex mr-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < reviews[currentReview].rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="font-semibold text-xl text-secondary">{reviews[currentReview].name}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* About Us section */}
      <AnimatedSection>
        <section className="py-12 sm:py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-secondary">À Propos de Nous</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-semibold text-primary mb-4">
                    À Propos de Philippe Primeurs by Fauve
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Fondé en 1995, Philippe Primeurs by Fauve est votre destination de confiance pour des produits frais
                    et locaux de haute qualité. Avec plus de 25 ans d'expérience, nous nous engageons à offrir le
                    meilleur de la nature tout en soutenant nos producteurs locaux.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <h4 className="text-lg font-semibold text-secondary mb-2">Notre Histoire</h4>
                      <p className="text-sm text-gray-600">
                        Depuis 1995, Philippe Primeurs by Fauve est votre source de confiance pour des produits frais et
                        locaux de qualité supérieure.
                      </p>
                    </div>
                    <div className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <h4 className="text-lg font-semibold text-secondary mb-2">Notre Sélection</h4>
                      <p className="text-sm text-gray-600">
                        Découvrez notre vaste gamme de fruits, légumes, et produits artisanaux soigneusement
                        sélectionnés pour vous.
                      </p>
                    </div>
                    <div className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <h4 className="text-lg font-semibold text-secondary mb-2">Notre Engagement</h4>
                      <p className="text-sm text-gray-600">
                        Nous nous engageons à soutenir les producteurs locaux et à promouvoir des pratiques agricoles
                        durables.
                      </p>
                    </div>
                    <div className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <h4 className="text-lg font-semibold text-secondary mb-2">Notre Service</h4>
                      <p className="text-sm text-gray-600">
                        Profitez de notre service de livraison à domicile et de notre équipe dévouée pour vous
                        conseiller.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <Link
                      href="/about"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                    >
                      En savoir plus sur nous
                    </Link>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative mt-8 lg:mt-0"
              >
                <div className="relative w-full aspect-[4/3] rounded-lg shadow-lg overflow-hidden">
                  <Image
                    src="/about/store.webp"
                    alt="Notre magasin"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-md">
                  <p className="text-lg font-semibold text-secondary">25+ années d'expérience</p>
                </div>
              </motion.div>
            </div>
            <motion.div
              className="mt-12 sm:mt-16 bg-gray-100 rounded-xl p-6 sm:p-8 shadow-inner"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-xl sm:text-2xl font-semibold text-center text-secondary mb-6">Nos Chiffres Clés</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                {[
                  { icon: <ShoppingBag size={32} />, value: "10,000+", label: "Clients Satisfaits" },
                  { icon: <Truck size={32} />, value: "200+", label: "Commandes par mois" },
                  { icon: <Apple size={32} />, value: "50+", label: "Variétés de Produits" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="text-primary mb-2">{stat.icon}</div>
                    <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* Store Hours and Delivery */}
      <section ref={openingHoursSectionRef} className="bg-gradient-to-r from-primary/5 to-secondary/5 py-16 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <motion.div
              className="w-full md:w-1/2"
              initial={{ opacity: 0, x: -100 }}
              animate={isOpeningHoursSectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src="/store/store-front.webp"
                  alt="Notre magasin"
                  fill
                  className="object-cover rounded-lg shadow-md"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>
            <motion.div
              className="w-full md:w-1/2"
              initial={{ opacity: 0, x: 100 }}
              animate={isOpeningHoursSectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Nos Horaires d'Ouverture</h2>
              <p className="text-lg text-gray-700 mb-6">
                Venez nous rendre visite pour découvrir nos produits frais et de qualité. Notre équipe est là pour vous
                accueillir et vous conseiller.
              </p>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { day: "Lundi - Vendredi", hours: "8h00 - 20h00" },
                    { day: "Samedi", hours: "8h00 - 19h00" },
                    { day: "Dimanche", hours: "9h00 - 18h00" },
                  ].map((schedule, index) => (
                    <div
                      key={schedule.day}
                      className={`p-4 rounded-lg ${index === 2 ? "col-span-2 bg-primary/10" : "bg-gray-100"}`}
                    >
                      <h3 className="text-lg font-semibold text-secondary mb-2">{schedule.day}</h3>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-primary mr-2" />
                        <p className="text-gray-700">{schedule.hours}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative bg-gradient-to-r from-primary to-secondary py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-8 md:mb-0 md:mr-8">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Savourez la Fraîcheur
                <br />à Chaque Bouchée
              </h2>
              <p className="text-xl mb-6 max-w-lg">
                Découvrez nos produits locaux de saison. Commencez votre voyage gustatif maintenant !
              </p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-primary hover:text-white transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 px-6 py-3 text-lg font-semibold rounded-full"
                >
                  Explorer nos produits
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
            <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-[3/2]">
              <Image
                src="/store/products.webp"
                alt="Assortiment de fruits et légumes frais"
                fill
                className="object-cover rounded-lg shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
      </section>
    </div>
  )
}

const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  )
}

