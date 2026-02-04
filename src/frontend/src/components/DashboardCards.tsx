import { useNavigate } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Package, FolderTree, Users, Store, Upload, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

const cards = [
  {
    title: 'Productos',
    description: 'Gestiona el catálogo de productos',
    icon: Package,
    path: '/admin/products',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Categorías',
    description: 'Organiza tus productos por categorías',
    icon: FolderTree,
    path: '/admin/categories',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Administradores',
    description: 'Gestiona usuarios administradores',
    icon: Users,
    path: '/admin/admin-users',
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Detalles de Tienda',
    description: 'Configura la información de tu tienda',
    icon: Store,
    path: '/admin/store-details',
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Importar Datos',
    description: 'Importa productos y categorías',
    icon: Upload,
    path: '/admin/import',
    color: 'from-pink-500 to-pink-600',
  },
  {
    title: 'Estadísticas',
    description: 'Visualiza métricas y reportes',
    icon: TrendingUp,
    path: '/admin',
    color: 'from-indigo-500 to-indigo-600',
  },
];

export default function DashboardCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card
            key={card.path}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate({ to: card.path })}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                Acceder →
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
