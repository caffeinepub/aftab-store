import React from 'react';
import { useGetStoreDetails } from '../hooks/useQueries';
import { formatWhatsAppApiNumber } from '../utils/phoneFormatter';

export default function StoreBanner() {
  const { data: storeDetails } = useGetStoreDetails();
  
  // Get WhatsApp number from store details or use fallback
  const whatsappNumber = storeDetails?.whatsapp || '695250655';
  const whatsappUrl = `https://wa.me/${formatWhatsAppApiNumber(whatsappNumber)}`;

  return (
    <section className="relative w-full h-[250px] md:h-[500px] overflow-hidden">
      {/* Banner Image */}
      <img
        src="https://i.imgur.com/br84lFD.png"
        alt="Banner de Aftab Store"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative h-full max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 drop-shadow-lg">
          Aftab Store
        </h1>

        <div className="space-y-2 md:space-y-4 max-w-3xl">
          <p className="text-sm md:text-xl text-white drop-shadow-md">
            Productos auténticos de comestibles paquistaníes, indios y latinos entregados frescos a su puerta
          </p>

          <p className="text-xs md:text-lg text-white drop-shadow-md">
            Visite nuestra tienda para enviar/recibir dinero a través de MoneyGram, RIA, Titanes, Europhil e ITransfer
          </p>

          {/* Dynamic WhatsApp Line - Hidden until loaded */}
          {storeDetails && (
            <p className="text-xs md:text-lg text-white drop-shadow-md pt-1 md:pt-2">
              Haga su pedido a través de nuestro{' '}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/90 transition-colors"
              >
                WhatsApp
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
