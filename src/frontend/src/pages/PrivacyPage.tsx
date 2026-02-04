import React, { useEffect } from 'react';
import { useGetStoreDetails } from '../hooks/useQueries';

export default function PrivacyPage() {
  // Scroll to top immediately on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: storeDetails } = useGetStoreDetails();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-foreground">
        Política de Privacidad
      </h1>

      <div className="privacy-content space-y-8">
        {/* Introduction */}
        <section>
          <p className="text-muted-foreground leading-relaxed">
            En {storeDetails?.name || 'AFTAB RETAIL'}, nos comprometemos a proteger su privacidad y
            garantizar la seguridad de su información personal. Esta política de privacidad explica
            qué datos recopilamos, cómo los utilizamos y cuáles son sus derechos.
          </p>
        </section>

        {/* Datos Recolectados */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Datos Recolectados</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Recopilamos información limitada para mejorar su experiencia en nuestro sitio web:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Información de contacto:</strong> Cuando se
                comunica con nosotros a través de nuestros canales (teléfono, WhatsApp, email),
                podemos recopilar su nombre, número de teléfono y dirección de correo electrónico.
              </li>
              <li>
                <strong className="text-foreground">Cookies funcionales:</strong> Utilizamos cookies
                técnicas necesarias para el funcionamiento básico del sitio web, como mantener su
                sesión activa y recordar sus preferencias de navegación.
              </li>
              <li>
                <strong className="text-foreground">Datos de navegación:</strong> Información sobre
                cómo utiliza nuestro sitio web, incluyendo las páginas visitadas y los productos
                consultados, para mejorar nuestros servicios.
              </li>
            </ul>
          </div>
        </section>

        {/* Propósito del Uso */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Propósito del Uso</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Utilizamos la información recopilada para los siguientes propósitos:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Mejorar la funcionalidad:</strong> Optimizar el
                rendimiento y la experiencia de usuario en nuestro sitio web.
              </li>
              <li>
                <strong className="text-foreground">Analítica:</strong> Comprender cómo los
                visitantes interactúan con nuestro sitio para mejorar nuestros productos y
                servicios.
              </li>
              <li>
                <strong className="text-foreground">Integración con Google Maps:</strong> Mostrar
                nuestra ubicación y proporcionar direcciones a nuestra tienda física.
              </li>
              <li>
                <strong className="text-foreground">Cookies técnicas:</strong> Garantizar el
                funcionamiento correcto del sitio web y mantener sus preferencias de navegación.
              </li>
              <li>
                <strong className="text-foreground">Comunicación:</strong> Responder a sus consultas
                y proporcionarle información sobre nuestros productos cuando nos contacta
                directamente.
              </li>
            </ul>
          </div>
        </section>

        {/* Derechos del Usuario */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Derechos del Usuario</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Usted tiene los siguientes derechos con respecto a su información personal:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Derecho de acceso:</strong> Puede solicitar una
                copia de la información personal que tenemos sobre usted.
              </li>
              <li>
                <strong className="text-foreground">Derecho de rectificación:</strong> Puede
                solicitar que corrijamos cualquier información inexacta o incompleta.
              </li>
              <li>
                <strong className="text-foreground">Derecho de eliminación:</strong> Puede solicitar
                que eliminemos su información personal, sujeto a ciertas excepciones legales.
              </li>
              <li>
                <strong className="text-foreground">Control de cookies:</strong> Puede gestionar o
                eliminar las cookies a través de la configuración de su navegador. Tenga en cuenta
                que deshabilitar las cookies puede afectar la funcionalidad del sitio web.
              </li>
            </ul>
          </div>
        </section>

        {/* Gestión de Consentimiento */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Gestión de Consentimiento de Cookies
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Nuestro sitio web utiliza únicamente cookies técnicas esenciales para su
              funcionamiento. Estas cookies son necesarias para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Mantener su sesión de navegación activa</li>
              <li>Recordar sus preferencias de idioma y configuración</li>
              <li>Garantizar la seguridad del sitio web</li>
            </ul>
            <p className="mt-4">
              Puede gestionar las cookies a través de la configuración de su navegador web. La
              mayoría de los navegadores le permiten:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Ver qué cookies están almacenadas</li>
              <li>Eliminar cookies individualmente o todas a la vez</li>
              <li>Bloquear cookies de sitios específicos</li>
              <li>Bloquear todas las cookies de terceros</li>
            </ul>
          </div>
        </section>

        {/* Información de Contacto */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Información de Contacto</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Si tiene preguntas sobre esta política de privacidad o desea ejercer sus derechos,
              puede contactarnos a través de:
            </p>
            <div className="bg-muted p-6 rounded-lg border border-border mt-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {storeDetails?.name || 'AFTAB RETAIL'}
              </h3>
              <div className="space-y-2">
                <p>
                  <strong className="text-foreground">Dirección:</strong>{' '}
                  {storeDetails?.address || 'C. Albertillas, 5, LOCAL, 29003 Málaga'}
                </p>
                <p>
                  <strong className="text-foreground">Teléfono:</strong>{' '}
                  <a
                    href={`tel:${storeDetails?.phone || '952233833'}`}
                    className="text-primary hover:underline"
                  >
                    {storeDetails?.phone || '952233833'}
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">WhatsApp:</strong>{' '}
                  <a
                    href={`https://wa.me/34${storeDetails?.whatsapp || '695250655'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {storeDetails?.whatsapp || '695250655'}
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a
                    href={`mailto:${storeDetails?.email || 'aldolocutoriomalaga@gmail.com'}`}
                    className="text-primary hover:underline break-all"
                  >
                    {storeDetails?.email || 'aldolocutoriomalaga@gmail.com'}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Actualizaciones */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Actualizaciones de la Política
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Nos reservamos el derecho de actualizar esta política de privacidad en cualquier
              momento. Le recomendamos que revise esta página periódicamente para estar informado
              sobre cómo protegemos su información.
            </p>
            <p className="text-sm italic">Última actualización: Enero 2025</p>
          </div>
        </section>
      </div>
    </div>
  );
}
