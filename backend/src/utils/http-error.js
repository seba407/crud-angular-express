/** Error con código HTTP; el middleware de errores lo traduce a la respuesta JSON. */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Record<string, string>} [errors] errores de validación por campo
   */
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
