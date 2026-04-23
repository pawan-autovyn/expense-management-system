import { HttpInterceptorFn } from '@angular/common/http';

import { STORAGE_KEYS } from '../constants/app.constants';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const rawSession = localStorage.getItem(STORAGE_KEYS.session);

  if (!rawSession) {
    return next(request);
  }

  try {
    const parsedSession = JSON.parse(rawSession) as { accessToken?: string };
    const accessToken = parsedSession.accessToken;

    if (!accessToken) {
      return next(request);
    }

    return next(
      request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  } catch {
    return next(request);
  }
};
