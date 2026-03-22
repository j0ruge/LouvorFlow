/**
 * Configuração centralizada de RBAC — roles e permissions protegidas.
 *
 * Define quais roles e permissions são de nível plataforma e só podem
 * ser visualizadas/atribuídas por super-admins. Usado em services e
 * controllers para filtrar listagens e prevenir escalação de privilégios.
 */

/** Nomes de roles protegidas — apenas super-admin pode ver e atribuir. */
export const PROTECTED_ROLE_NAMES: string[] = ['super-admin'];

/** Nomes de permissions protegidas — apenas super-admin pode ver e atribuir. */
export const PROTECTED_PERMISSION_NAMES: string[] = ['super_admin_access'];
