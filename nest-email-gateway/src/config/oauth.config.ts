export const oauthConfig = {
  google: {
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'email',
      'profile',
    ].join(' '),
  },
  microsoft: {
    scopes: [
      'offline_access',
      'openid',
      'profile',
      'email',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Mail.Read',
    ].join(' '),
  },
} as const;
