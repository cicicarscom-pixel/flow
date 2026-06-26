import { AppError } from './AppError';

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}
