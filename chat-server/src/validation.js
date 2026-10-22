import { AppError } from './errors.js';

export function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('VALIDATION_ERROR', 'Ожидается JSON-объект.');
  }
  return value;
}

export function text(value, field, min, max) {
  if (typeof value !== 'string') {
    throw new AppError('VALIDATION_ERROR', `Поле ${field} должно быть строкой.`, 400, { field });
  }
  const cleaned = value.trim();
  const length = [...cleaned].length;
  if (length < min || length > max || cleaned.includes('\u0000')) {
    throw new AppError('VALIDATION_ERROR', `Поле ${field}: допустимая длина от ${min} до ${max} символов.`, 400, { field });
  }
  return cleaned;
}

export function displayName(value) {
  const name = text(value, 'name', 2, 30);
  if (/[\u0000-\u001f\u007f]/u.test(name)) {
    throw new AppError('VALIDATION_ERROR', 'Имя не должно содержать переносы строк и управляющие символы.', 400, { field: 'name' });
  }
  return name;
}

export function positiveInteger(value, field, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/u.test(value)) {
    throw new AppError('VALIDATION_ERROR', `${field} должен быть положительным целым числом.`, 400, { field });
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) {
    throw new AppError('VALIDATION_ERROR', `Недопустимое значение ${field}.`, 400, { field });
  }
  return number;
}

export function clientMessageId(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)) {
    throw new AppError('VALIDATION_ERROR', 'clientMessageId должен быть UUID, например из crypto.randomUUID().', 400, { field: 'clientMessageId' });
  }
  return value.toLowerCase();
}
