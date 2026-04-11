/**
 * Configuração global dos testes do frontend.
 *
 * Registra os matchers customizados do @testing-library/jest-dom
 * (ex: toBeInTheDocument, toHaveTextContent) para uso em todos os testes.
 *
 * Importa matchers diretamente em vez de usar o sub-path `@testing-library/jest-dom/vitest`
 * para evitar problemas de resolução de módulos no monorepo com hoisting.
 */
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);
