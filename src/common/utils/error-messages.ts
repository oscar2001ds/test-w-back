const ErrorMessages = {
  // General
  DATABASE_ERROR: 'databaseError',
  CREATE_DB_ERROR: 'createDBError',
  UPDATE_DB_ERROR: 'updateDBError',
  // Timezone
  TIMEZONE_EMPTY_NAME: 'timezoneEmptyName',
  TIMEZONE_ALREADY_EXISTS: 'timezoneAlreadyExists',
  TIMEZONE_NOT_FOUND: 'timezoneNotFound',
  // Permission
  PERMISSION_NOT_FOUND: 'permissionNotFound',
  // Role
  ROLE_ID_REQUIRED: 'roleIdRequired',
  ROLE_NAME_REQUIRED: 'roleNameRequired',
  ROLE_ALREADY_EXISTS: 'roleAlreadyExists',
  ROLE_NOT_FOUND: 'roleNotFound',
  // User
  USER_MISSING_INFORMATION: 'userMissingInformation',
  USER_ALREADY_EXISTS: 'userAlreadyExists',
  USER_NOT_FOUND: 'userNotFound',
  TERMS_MUST_BE_ACCEPTED: 'termsMustBeAccepted',
  // User password
  USER_PASSWORD_ALREADY_EXISTS: 'userPasswordAlreadyExists',
  USER_PASSWORD_NOT_FOUND: 'userPasswordNotFound',
  // User code
  USER_CODE_ALREADY_EXISTS: 'userCodeAlreadyExists',
  USER_CODE_NOT_FOUND: 'userCodeNotFound',
  USER_CODE_CANNOT_BE_UPDATED: 'userCodeCannotBeUpdated',
  // User recover
  USER_RECOVER_ALREADY_EXISTS: 'userRecoverAlreadyExists',
  USER_RECOVER_NOT_FOUND: 'userRecoverNotFound',
  REFRESH_TOKEN_INVALID: 'refreshTokenInvalid',
  REFRESH_TOKEN_LIMIT_EXCEEDED: 'refreshTokenLimitExceeded',
  REFRESH_TOKEN_TIME_LIMIT_EXCEEDED: 'refreshTokenTimeLimitExceeded',
  // Session
  SESSION_ALREADY_EXISTS: 'sessionAlreadyExists',
  SESSION_NOT_FOUND: 'sessionNotFound',
  INVALID_CREDENTIALS: 'invalidCredentials',
  INVALID_PASSWORD: 'invalidPassword',
  INVALID_CAPTCHA: 'invalidCaptcha',
  INVALID_AUTHORIZATION_METHOD: 'invalidAuthorizationMethod',
  UNAUTHORIZED: 'Unauthorized',
  INVALID_INPUT: 'invalidInput',
  // Misc
  AUTH_TOKEN_MISSING: 'authTokenMissing',
  X_SSR_FORBIDDEN_REMOTE_ADDRESS: 'xSSRForbiddenRemoteAddress',
  ENV_VALIDATION_ERROR: 'envValidationError',
  // User Recover
  USER_RECOVER_ALREADY_USED: 'userRecoverAlreadyUsed',
};

export default ErrorMessages;
