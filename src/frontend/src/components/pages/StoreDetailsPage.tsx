import { useState, useEffect } from 'react';
import { Store, Upload, Trash2, Save, RotateCcw, Mail, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '../../hooks/useToast';
import { useGetStoreDetails, useUpdateStoreDetails } from '../../hooks/useQueries';
import { ExternalBlob, StoreHours, Coordinates } from '../../backend';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DAYS_MAP = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
} as const;

export default function StoreDetailsPage() {
  const toast = useToast();
  const { data: storeDetails, isLoading: isLoadingDetails } = useGetStoreDetails();
  const updateStoreDetailsMutation = useUpdateStoreDetails();

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [storeHours, setStoreHours] = useState<StoreHours>({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: 36.69699092702079,
    longitude: -4.447439687321973,
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Original values for reset
  const [originalValues, setOriginalValues] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    storeHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    } as StoreHours,
    coordinates: {
      latitude: 36.69699092702079,
      longitude: -4.447439687321973,
    } as Coordinates,
    bannerUrl: null as string | null,
  });

  // Initialize form with store details
  useEffect(() => {
    if (storeDetails) {
      const values = {
        name: storeDetails.name,
        address: storeDetails.address,
        phone: storeDetails.phone,
        whatsapp: storeDetails.whatsapp,
        email: storeDetails.email,
        storeHours: storeDetails.storeHours,
        coordinates: storeDetails.coordinates,
        bannerUrl: storeDetails.banner?.getDirectURL() || null,
      };

      setName(values.name);
      setAddress(values.address);
      setPhone(values.phone);
      setWhatsapp(values.whatsapp);
      setEmail(values.email);
      setStoreHours(values.storeHours);
      setCoordinates(values.coordinates);
      setExistingBannerUrl(values.bannerUrl);
      setOriginalValues(values);
    }
  }, [storeDetails]);

  const compressImageToWebP = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Calculate new dimensions (max 1920px width for banner)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;

          if (width > maxWidth) {
            height = (height / width) * maxWidth;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                });
                resolve(webpFile);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    try {
      setIsCompressing(true);
      const compressedFile = await compressImageToWebP(file);
      setBannerFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
        setExistingBannerUrl(null);
      };
      reader.readAsDataURL(compressedFile);

      toast.success('Imagen cargada y comprimida exitosamente');
    } catch (error) {
      toast.error('Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setExistingBannerUrl(null);
  };

  const handleStoreHoursChange = (day: keyof StoreHours, value: string) => {
    setStoreHours((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('El nombre de la tienda es obligatorio');
      return;
    }

    if (!address.trim()) {
      toast.error('La dirección es obligatoria');
      return;
    }

    if (!phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return;
    }

    if (!whatsapp.trim()) {
      toast.error('El WhatsApp es obligatorio');
      return;
    }

    if (!email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    if (!validateEmail(email.trim())) {
      toast.error('Por favor, ingresa un email válido');
      return;
    }

    // Validate coordinates
    if (isNaN(coordinates.latitude) || coordinates.latitude < -90 || coordinates.latitude > 90) {
      toast.error('La latitud debe estar entre -90 y 90');
      return;
    }

    if (isNaN(coordinates.longitude) || coordinates.longitude < -180 || coordinates.longitude > 180) {
      toast.error('La longitud debe estar entre -180 y 180');
      return;
    }

    try {
      let bannerBlob: ExternalBlob | undefined = undefined;
      if (bannerFile) {
        const bytes = new Uint8Array(await bannerFile.arrayBuffer());
        bannerBlob = ExternalBlob.fromBytes(bytes);
      }

      await updateStoreDetailsMutation.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        storeHours,
        coordinates,
        banner: bannerBlob,
      });

      toast.success('Detalles de la tienda guardados exitosamente');

      // Update original values after successful save
      setOriginalValues({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        storeHours,
        coordinates,
        bannerUrl: bannerPreview || existingBannerUrl,
      });
      setBannerFile(null);
      if (bannerPreview) {
        setExistingBannerUrl(bannerPreview);
        setBannerPreview(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar los detalles de la tienda');
    }
  };

  const handleReset = () => {
    setName(originalValues.name);
    setAddress(originalValues.address);
    setPhone(originalValues.phone);
    setWhatsapp(originalValues.whatsapp);
    setEmail(originalValues.email);
    setStoreHours(originalValues.storeHours);
    setCoordinates(originalValues.coordinates);
    setBannerFile(null);
    setBannerPreview(null);
    setExistingBannerUrl(originalValues.bannerUrl);
    toast.info('Valores restaurados');
  };

  const isLoading = updateStoreDetailsMutation.isPending || isCompressing;
  const hasChanges =
    name !== originalValues.name ||
    address !== originalValues.address ||
    phone !== originalValues.phone ||
    whatsapp !== originalValues.whatsapp ||
    email !== originalValues.email ||
    JSON.stringify(storeHours) !== JSON.stringify(originalValues.storeHours) ||
    coordinates.latitude !== originalValues.coordinates.latitude ||
    coordinates.longitude !== originalValues.coordinates.longitude ||
    bannerFile !== null ||
    (bannerPreview === null && existingBannerUrl !== originalValues.bannerUrl);

  // Get current preview URL for live preview
  const currentBannerUrl = bannerPreview || existingBannerUrl;
  const currentName = name || 'AFTAB RETAIL';

  if (isLoadingDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detalles de la Tienda
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configura la información de tu tienda
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Detalles de la Tienda
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configura la información de tu tienda
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tienda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la Tienda <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa el nombre de la tienda"
                disabled={isLoading}
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <Label htmlFor="banner">Imagen del Banner</Label>
              <div className="space-y-4">
                {currentBannerUrl && (
                  <div className="relative w-full">
                    <img
                      src={currentBannerUrl}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveBanner}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading || isCompressing}
                    className="cursor-pointer"
                  />
                  {isCompressing && (
                    <div className="text-sm text-gray-500">Comprimiendo...</div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Formatos aceptados: JPG, PNG, WebP. Máximo 10MB. La imagen se comprimirá automáticamente.
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                Dirección <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ingresa la dirección de la tienda"
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ingresa el teléfono"
                disabled={isLoading}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ingresa el número de WhatsApp"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email de la Tienda <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aldolocutoriomalaga@gmail.com"
                disabled={isLoading}
              />
            </div>

            {/* Store Hours Section */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <Label className="text-base font-semibold">Horario de la Tienda</Label>
              </div>
              <p className="text-sm text-gray-500">
                Formato: "09:30 – 14:00, 17:00 – 22:00" o "Closed" para cerrado
              </p>
              {(Object.keys(DAYS_MAP) as Array<keyof StoreHours>).map((day) => (
                <div key={day} className="space-y-1">
                  <Label htmlFor={day} className="text-sm">
                    {DAYS_MAP[day]}
                  </Label>
                  <Input
                    id={day}
                    value={storeHours[day]}
                    onChange={(e) => handleStoreHoursChange(day, e.target.value)}
                    placeholder="09:30 – 14:00, 17:00 – 22:00"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>

            {/* Coordinates Section */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <Label className="text-base font-semibold">Coordenadas del Mapa</Label>
              </div>
              <p className="text-sm text-gray-500">
                Coordenadas para mostrar en Google Maps y navegación.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="latitude" className="text-sm">
                    Latitud
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={coordinates.latitude}
                    onChange={(e) =>
                      setCoordinates((prev) => ({
                        ...prev,
                        latitude: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="36.69699092702079"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="longitude" className="text-sm">
                    Longitud
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={coordinates.longitude}
                    onChange={(e) =>
                      setCoordinates((prev) => ({
                        ...prev,
                        longitude: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="-4.447439687321973"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Stacked, Desktop Horizontal */}
            <div className="flex flex-col md:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="w-full md:flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading || !hasChanges}
                className="w-full md:flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Valores Originales
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Así se verá tu tienda en la página principal:
              </p>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {/* Banner Preview */}
                {currentBannerUrl ? (
                  <div className="w-full h-48 relative">
                    <img
                      src={currentBannerUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <h1 className="text-3xl font-bold text-white p-6">
                        {currentName}
                      </h1>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <h1 className="text-3xl font-bold text-white">
                      {currentName}
                    </h1>
                  </div>
                )}

                {/* Store Info Preview */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Dirección
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {address || 'C. Albertillas, 5, LOCAL, 29003 Málaga'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Teléfono
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {phone || '952233833'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="h-4 w-4 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        WhatsApp
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {whatsapp || '695250655'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {email || 'aldolocutoriomalaga@gmail.com'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Horario
                      </p>
                      <div className="space-y-1">
                        {(Object.keys(DAYS_MAP) as Array<keyof StoreHours>).map((day) => (
                          <div key={day} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {DAYS_MAP[day]}:
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {storeHours[day] || 'No especificado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Ubicación
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Lat: {coordinates.latitude.toFixed(6)}, Lng: {coordinates.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                * La vista previa se actualiza en tiempo real mientras editas los campos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
