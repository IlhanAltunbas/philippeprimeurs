"use client"

import CookieConsent from "react-cookie-consent";
import Link from "next/link";
import { useCart } from "@/lib/cart"; // useCart hook'unu import et
import { useCallback } from 'react';

export default function CookieConsentWrapper() {
  const { persistCart } = useCart(); // persistCart eylemini al

  const handleAccept = useCallback(() => {
    // Çerezin manuel olarak ayarlandığından emin olalım (CookieConsent bazen gecikebilir)
    // js-cookie kütüphanesi zaten cart.ts'de kullanılıyor, burada da kullanabiliriz.
    // Ancak CookieConsent bunu zaten yapmalı. Şimdilik sadece persistCart'ı çağıralım.
    persistCart();
  }, [persistCart]);

  return (
    <CookieConsent
      location="bottom"
      buttonText="J'accepte"
      cookieName="philippePrimeursCookieConsent" // cart.ts'deki ile aynı isim
      style={{ background: "#2B373B", fontSize: "14px", zIndex: 1000 }} // z-index ekleyebiliriz
      buttonStyle={{ color: "#4e503b", fontSize: "13px", background: "#F1F1F1", borderRadius: "3px", padding: "10px 15px" }}
      expires={150}
      onAccept={handleAccept} // Onay verildiğinde handleAccept fonksiyonunu çağır
      // debug={true}
    >
      Ce site utilise des cookies essentiels pour assurer son bon fonctionnement et mémoriser votre panier.{" "}
      <span style={{ fontSize: "12px" }}>
        En cliquant sur "J'accepte", vous consentez à leur utilisation. Pour en savoir plus, consultez notre{" "}
        <Link href="/privacy-policy" className="underline text-gray-300 hover:text-white">
          politique de confidentialité
        </Link>.
      </span>
    </CookieConsent>
  );
} 