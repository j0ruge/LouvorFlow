import type { IDateProvider } from '../../../src/types/auth.types.js';

/**
 * Provedor fake de operações com datas para uso em testes unitários.
 *
 * Permite controlar a data atual via `setCurrentDate`, possibilitando
 * testes determinísticos que dependem de tempo (expiração de tokens,
 * validade de refresh tokens, etc.).
 */
class FakeDateProvider implements IDateProvider {
  /** Data atual controlável para testes. */
  private currentDate: Date = new Date();

  /**
   * Define a data atual usada pelo provedor.
   *
   * Permite que testes controlem o "relógio" para cenários
   * de expiração e validade temporal.
   *
   * @param date - Data a ser usada como "agora".
   */
  setCurrentDate(date: Date): void {
    this.currentDate = date;
  }

  /**
   * Retorna a data atual controlada pelo teste.
   *
   * @returns Data definida via `setCurrentDate` ou `new Date()` por padrão.
   */
  dateNow(): Date {
    return this.currentDate;
  }

  /**
   * Compara duas datas e retorna a diferença em horas usando aritmética simples.
   *
   * @param start - Data de início.
   * @param end - Data de fim.
   * @returns Diferença em horas (truncada para inteiro).
   */
  compareInHours(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Converte uma data para string ISO-8601.
   *
   * @param date - Data a ser convertida.
   * @returns String ISO-8601 da data.
   */
  convertToUTC(date: Date): string {
    return date.toISOString();
  }

  /**
   * Compara duas datas e retorna a diferença em dias usando aritmética simples.
   *
   * @param start - Data de início.
   * @param end - Data de fim.
   * @returns Diferença em dias (truncada para inteiro).
   */
  compareInDays(start: Date, end: Date): number {
    return Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Adiciona N dias à data atual controlada e retorna a nova data.
   * Utiliza aritmética em milissegundos (UTC-safe) para evitar
   * problemas com horário de verão e fuso horário local.
   *
   * @param days - Número de dias a adicionar.
   * @returns Nova data com os dias adicionados à data atual do fake.
   */
  addDays(days: number): Date {
    return new Date(this.currentDate.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

export default new FakeDateProvider();
