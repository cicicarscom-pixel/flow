import { AppError } from './AppError';

export class NetworkError extends AppError {
  constructor(message: string = 'A network error occurred.') {
    super(message, 503, 'NETWORK_ERROR');
  }
}
