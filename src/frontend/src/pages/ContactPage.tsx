import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetStoreDetails } from '../hooks/useQueries';
import { MapPin, Phone, Mail, Navigation, Loader2 } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Button } from '../components/ui/button';
import { formatSpanishPhoneDisplay, formatWhatsAppApiNumber } from '../utils/phoneFormatter';

export default function ContactPage() {
  const queryClient = useQueryClient();

  // Scroll to top immediately on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { data: storeDetails, isLoading, isError, refetch } = useGetStoreDetails();

  // Set isInitialLoading to false only when fetch completes
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false);
    }
  }, [isLoading]);

  // Cleanup on unmount: remove Contact page-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['storeDetails'], exact: false });
    };
  }, [queryClient]);

  // Initial loading state
  if (isInitialLoading || isLoading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando información de contacto...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive text-lg font-medium">Error al cargar la información de contacto</p>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Missing data state - show loading spinner instead of empty message
  if (!storeDetails) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando información de contacto...</p>
        </div>
      </div>
    );
  }

  const { name, address, phone, whatsapp, email, storeHours, coordinates } = storeDetails;

  // Format phone numbers for display and links
  const phoneDisplay = formatSpanishPhoneDisplay(phone);
  const whatsappDisplay = formatSpanishPhoneDisplay(whatsapp);
  const phoneLink = `tel:${formatWhatsAppApiNumber(phone)}`;
  const whatsappLink = `https://wa.me/${formatWhatsAppApiNumber(whatsapp)}`;

  // Format store hours for display
  const daysMap = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const formatHours = (hours: string) => {
    // Split by comma for multi-session days
    return hours.split(',').map((session, idx) => (
      <span key={idx} className="block">
        {session.trim()}
      </span>
    ));
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
  const emailUrl = `mailto:${email}`;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-foreground">Contacto</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Information Section */}
        <div className="contact-card bg-card rounded-lg shadow-md p-6 border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Información de Contacto</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-primary">{name}</h3>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Dirección</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {address}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Teléfono</p>
                <a
                  href={phoneLink}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <SiWhatsapp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">WhatsApp</p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {whatsappDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Email</p>
                <a
                  href={emailUrl}
                  className="text-muted-foreground hover:text-primary transition-colors break-all"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Store Hours Section */}
        <div className="contact-card bg-card rounded-lg shadow-md p-6 border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Horario de Apertura</h2>
          
          <div className="space-y-3">
            {Object.entries(daysMap).map(([key, label]) => (
              <div key={key} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-medium text-foreground min-w-[80px]">{label}</span>
                  <span className="text-muted-foreground text-right">
                    {formatHours(storeHours[key as keyof typeof storeHours])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="contact-card bg-card rounded-lg shadow-md p-6 border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Nuestra Ubicación</h2>
          
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-border">
              <iframe
                src={`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=15&output=embed`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de la tienda"
                className="w-full h-[300px] md:h-[400px]"
              />
            </div>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-3 rounded-lg font-medium"
            >
              <Navigation className="w-5 h-5" />
              Obtener Direcciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
