import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import type { IDateProvider } from '../types/auth.types.js';

dayjs.extend(utc);

/**
 * Provedor de operações com datas usando `dayjs` com plugin UTC.
 *
 * Abstrai cálculos de diferença, conversão e manipulação de datas,
 * garantindo que todas as operações sejam realizadas em UTC.
 */
class DateProvider implements IDateProvider {
  /**
   * Compara duas datas e retorna a diferença em horas.
   *
   * @param start - Data de início.
   * @param end - Data de fim.
   * @returns Diferença em horas (positivo se end > start).
   */
  compareInHours(start: Date, end: Date): number {
    return dayjs(end).diff(dayjs(start), 'hours');
  }

  /**
   * Converte uma data para string ISO-8601 em UTC.
   *
   * @param date - Data a ser convertida.
   * @returns String formatada em ISO-8601 UTC.
   */
  convertToUTC(date: Date): string {
    return dayjs(date).utc().format();
  }

  /**
   * Retorna a data/hora atual em UTC.
   *
   * @returns Objeto Date representando o momento atual em UTC.
   */
  dateNow(): Date {
    return dayjs().utc().toDate();
  }

  /**
   * Compara duas datas e retorna a diferença em dias.
   *
   * @param start - Data de início.
   * @param end - Data de fim.
   * @returns Diferença em dias (positivo se end > start).
   */
  compareInDays(start: Date, end: Date): number {
    return dayjs(end).diff(dayjs(start), 'days');
  }

  /**
   * Adiciona N dias à data atual em UTC e retorna a nova data.
   *
   * @param days - Número de dias a adicionar.
   * @returns Nova data com os dias adicionados.
   */
  addDays(days: number): Date {
    return dayjs().utc().add(days, 'days').toDate();
  }
}

export default new DateProvider();
