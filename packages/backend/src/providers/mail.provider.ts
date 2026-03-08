import nodemailer, { type Transporter } from 'nodemailer';

import type { IMailProvider, IMailTemplateData } from '../types/auth.types.js';

/**
 * Provedor de envio de emails usando Nodemailer com conta de teste Ethereal.
 *
 * Inicializa o transporte SMTP uma única vez (lazy singleton) e reutiliza
 * em todos os envios subsequentes. Ideal para ambientes de desenvolvimento.
 */
class MailProvider implements IMailProvider {
  /** Transporter SMTP inicializado sob demanda (lazy). */
  private transporter: Transporter | null = null;

  /**
   * Obtém ou cria o transporter Nodemailer.
   * Cria uma conta de teste Ethereal apenas na primeira invocação.
   *
   * @returns Transporter SMTP pronto para envio
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    const account = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    return this.transporter;
  }

  /**
   * Envia um email utilizando o transporter Ethereal singleton.
   *
   * @param params - Parâmetros do email.
   * @param params.to - Endereço de email do destinatário.
   * @param params.subject - Assunto do email.
   * @param params.templateData - Dados do template com variáveis para o corpo do email.
   */
  async sendMail({
    to,
    subject,
    templateData,
  }: {
    to: string;
    subject: string;
    templateData: IMailTemplateData;
  }): Promise<void> {
    const transporter = await this.getTransporter();

    /** Constrói o corpo do email a partir das variáveis do template. */
    const body = Object.entries(templateData.variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = await transporter.sendMail({
      from: 'LouvorFlow <noreply@louvorflow.com>',
      to,
      subject,
      text: body,
    });

    console.log(`[MailProvider] Preview URL: ${nodemailer.getTestMessageUrl(message)}`);
  }
}

export default new MailProvider();
