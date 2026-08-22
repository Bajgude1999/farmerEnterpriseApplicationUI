
export const environment = {
  production: false,
  // apiBaseUrl: 'http://10.190.143.90/agrostar',
  apiBaseUrl: 'http://localhost:8082/agrostar',
  //  websocketUrl: 'http://10.190.143.90/agrostar',
  websocketUrl: 'http://localhost:8082/agrostar',
  defaultLanguage: 'en',
  encriptionKey: 'abcd@1234567890xyz123ABCD@123456',
  supportedLanguages: [
    'en',
    'hi',
    'mr'
  ],
  authErrorExcludedUrls: [
    '/v1/token',
    '/v1/logout',
    '/v1/refreshToken',
    '/forget/password',
    '/v1/role/get-all',
    '/v1/encrypt',
    '/v1/decrypt',
    '/v1/product/get-all',
    '/v1/user/save',
    '/v1/product/**',
    '/v1/products/search',
    '/v1/user/get-by-mobile/**',
    '/v1/order/calculatetaxes',
    '/v1/order/save',
    '/v1/category/get-all',
    '/v1/brand/get-all',
    '/v1/location/states',
    '/v1/location/districts/**',
    '/v1/location/talukas/**',
    '/v1/email/contact'
  ]
};