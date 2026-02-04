import { useState, useMemo } from 'react';
import { Users, Shield, UserPlus, Copy, Search, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useToast } from '../../hooks/useToast';
import { useGetAllUserRoles, useAssignUserRole, useRemoveAdminRole } from '../../hooks/useQueries';

export default function AdminUsersPage() {
  const [newPrincipalId, setNewPrincipalId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'promote' | 'demote' | null;
    principal: string;
  }>({
    open: false,
    type: null,
    principal: '',
  });

  const { success, error: showError } = useToast();
  const { data: userRoles = [], isLoading, refetch } = useGetAllUserRoles();
  const assignUserRole = useAssignUserRole();
  const removeAdminRole = useRemoveAdminRole();

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = userRoles;

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((user) =>
        user.principal.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [userRoles, roleFilter, searchTerm]);

  // Count admins to prevent removing last admin
  const adminCount = useMemo(() => {
    return userRoles.filter((user) => user.role === 'admin').length;
  }, [userRoles]);

  // Validate principal ID format
  const validatePrincipalId = (id: string): boolean => {
    if (!id.trim()) return false;
    // Basic validation: should contain alphanumeric and hyphens
    const principalRegex = /^[a-z0-9-]+$/i;
    return principalRegex.test(id.trim());
  };

  // Handle adding new admin user
  const handleAddUser = async () => {
    const trimmedId = newPrincipalId.trim();

    if (!validatePrincipalId(trimmedId)) {
      showError('ID Principal inválido. Verifica el formato.');
      return;
    }

    // Check for duplicates
    const isDuplicate = userRoles.some(
      (user) => user.principal.toLowerCase() === trimmedId.toLowerCase()
    );

    if (isDuplicate) {
      showError('Este usuario ya existe en el sistema.');
      return;
    }

    try {
      await assignUserRole.mutateAsync({
        principalText: trimmedId,
        roleText: 'admin',
      });
      success('Usuario promovido a administrador exitosamente');
      setNewPrincipalId('');
      refetch();
    } catch (err: any) {
      showError(err.message || 'Error al agregar usuario');
    }
  };

  // Handle role change confirmation
  const handleRoleChange = (principal: string, action: 'promote' | 'demote') => {
    setConfirmDialog({
      open: true,
      type: action,
      principal,
    });
  };

  // Execute role change
  const executeRoleChange = async () => {
    const { type, principal } = confirmDialog;

    if (!type || !principal) return;

    try {
      if (type === 'promote') {
        await assignUserRole.mutateAsync({
          principalText: principal,
          roleText: 'admin',
        });
        success('Usuario promovido a administrador');
      } else {
        // Check if this is the last admin
        if (adminCount <= 1) {
          showError('No se puede quitar el último administrador');
          setConfirmDialog({ open: false, type: null, principal: '' });
          return;
        }

        await removeAdminRole.mutateAsync(principal);
        success('Permisos de administrador removidos');
      }
      refetch();
    } catch (err: any) {
      showError(err.message || 'Error al cambiar rol de usuario');
    } finally {
      setConfirmDialog({ open: false, type: null, principal: '' });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Usuarios Administradores
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona los usuarios con permisos de administrador del sistema
          </p>
        </div>
      </div>

      {/* Add User Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agregar Usuario Administrador
          </h3>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="principal-id" className="sr-only">
              ID Principal de Internet Identity
            </Label>
            <Input
              id="principal-id"
              type="text"
              placeholder="Ingresa el ID Principal de Internet Identity"
              value={newPrincipalId}
              onChange={(e) => setNewPrincipalId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddUser();
                }
              }}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAddUser}
            disabled={!newPrincipalId.trim() || assignUserRole.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {assignUserRole.isPending ? (
              'Agregando...'
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          El usuario será promovido automáticamente a administrador al agregarlo
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search" className="mb-2 block">
              Buscar por ID Principal
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="role-filter" className="mb-2 block">
              Filtrar por rol
            </Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchTerm || roleFilter !== 'all'
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">ID Principal</TableHead>
                    <TableHead className="w-[25%]">Rol Actual</TableHead>
                    <TableHead className="w-[25%] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.principal}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-md">{user.principal}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(user.principal)}
                            className="h-8 w-8 p-0"
                            title="Copiar ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Administrador
                            </>
                          ) : (
                            'Usuario'
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role === 'admin' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRoleChange(user.principal, 'demote')}
                            disabled={
                              adminCount <= 1 ||
                              removeAdminRole.isPending ||
                              assignUserRole.isPending
                            }
                            title={
                              adminCount <= 1
                                ? 'No se puede quitar el último administrador'
                                : 'Quitar permisos de administrador'
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Quitar Admin
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRoleChange(user.principal, 'promote')}
                            disabled={removeAdminRole.isPending || assignUserRole.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Promover a Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <div key={user.principal} className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">
                      ID Principal
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm truncate flex-1">
                        {user.principal}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.principal)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">
                      Rol Actual
                    </Label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Administrador
                          </>
                        ) : (
                          'Usuario'
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    {user.role === 'admin' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRoleChange(user.principal, 'demote')}
                        disabled={
                          adminCount <= 1 ||
                          removeAdminRole.isPending ||
                          assignUserRole.isPending
                        }
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Quitar Admin
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRoleChange(user.principal, 'promote')}
                        disabled={removeAdminRole.isPending || assignUserRole.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Promover a Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, type: null, principal: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'promote'
                ? 'Promover a Administrador'
                : 'Quitar Permisos de Administrador'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'promote' ? (
                <>
                  ¿Estás seguro de que deseas promover a este usuario a administrador?
                  <br />
                  <br />
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                    {confirmDialog.principal}
                  </span>
                  <br />
                  El usuario tendrá acceso completo al panel de administración.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas quitar los permisos de administrador a este
                  usuario?
                  <br />
                  <br />
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                    {confirmDialog.principal}
                  </span>
                  <br />
                  El usuario perderá acceso al panel de administración.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRoleChange}
              className={
                confirmDialog.type === 'promote'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {confirmDialog.type === 'promote' ? 'Promover' : 'Quitar Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
