/**
 * Re-exportação do hook useAuth do contexto de autenticação.
 *
 * Permite que os componentes importem o hook de autenticação
 * diretamente de `@/hooks/use-auth` seguindo o padrão do projeto
 * onde hooks ficam em `hooks/`.
 */
export { useAuth } from "@/contexts/AuthContext";
