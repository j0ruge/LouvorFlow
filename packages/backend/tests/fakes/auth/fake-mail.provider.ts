import type { IMailProvider, IMailTemplateData } from '../../../src/types/auth.types.js';

/** Parâmetros capturados em cada chamada de envio de email fake. */
interface ISentMail {
  to: string;
  subject: string;
  templateData: IMailTemplateData;
}

/**
 * Provedor fake de envio de emails para uso em testes unitários.
 *
 * Armazena todos os emails "enviados" em um array público `sentMails`,
 * permitindo que testes verifiquem se emails foram disparados
 * com os parâmetros corretos, sem realizar envio real.
 */
class FakeMailProvider implements IMailProvider {
  /** Lista de todos os emails enviados durante o teste. */
  public sentMails: ISentMail[] = [];

  /**
   * Simula o envio de um email adicionando os parâmetros ao array `sentMails`.
   *
   * @param params - Parâmetros do email.
   * @param params.to - Endereço de email do destinatário.
   * @param params.subject - Assunto do email.
   * @param params.templateData - Dados do template com variáveis.
   */
  async sendMail(params: {
    to: string;
    subject: string;
    templateData: IMailTemplateData;
  }): Promise<void> {
    this.sentMails.push(params);
  }
}

export default new FakeMailProvider();
