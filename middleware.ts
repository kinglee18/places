import { auth } from './auth';

export default auth;

export const config = {
  matcher: ['/registro/:path*', '/mis-propiedades/:path*'],
};
