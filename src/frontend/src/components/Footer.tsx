import React from 'react';
import { SiFacebook, SiInstagram } from 'react-icons/si';
import { useGetStoreDetails } from '../hooks/useQueries';
import { formatSpanishPhoneDisplay, formatWhatsAppApiNumber } from '../utils/phoneFormatter';

export default function Footer() {
  const { data: storeDetails } = useGetStoreDetails();

  // Get phone numbers from store details or use fallbacks
  const telephoneNumber = storeDetails?.phone || '952233833';
  const whatsappNumber = storeDetails?.whatsapp || '695250655';

  // Format for display
  const telephoneDisplay = formatSpanishPhoneDisplay(telephoneNumber);
  const whatsappDisplay = formatSpanishPhoneDisplay(whatsappNumber);

  // Format for links
  const telephoneLink = `tel:${formatWhatsAppApiNumber(telephoneNumber)}`;
  const whatsappLink = `https://wa.me/${formatWhatsAppApiNumber(whatsappNumber)}`;

  return (
    <footer className="bg-muted border-t border-border mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {storeDetails?.name || 'AFTAB RETAIL'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Productos auténticos de comestibles paquistaníes, indios y latinos.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Contacto</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Dirección:</span>{' '}
                {storeDetails?.address || 'C. Albertillas, 5, LOCAL, 29003 Málaga'}
              </p>
              {/* Hide until loaded, then show */}
              {storeDetails && (
                <>
                  <p>
                    <span className="font-medium">Teléfono:</span>{' '}
                    <a
                      href={telephoneLink}
                      className="hover:text-primary transition-colors"
                    >
                      {telephoneDisplay}
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">WhatsApp:</span>{' '}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {whatsappDisplay}
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Social & Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Síguenos</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <SiFacebook className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <SiInstagram className="h-6 w-6" />
              </a>
            </div>
            <div className="space-y-2 text-sm">
              <a
                href="/contacto"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </a>
              <a
                href="/privacy"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            © 2025. Built with love using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
