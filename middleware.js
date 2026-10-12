import {NextResponse} from 'next/server';import {jwtVerify} from 'jose';
const secret=new TextEncoder().encode(process.env.AUTH_SECRET||'dev-secret-change-me');
const customerRoutes=['/shop','/product','/categories','/branches','/cart','/checkout','/account','/orders','/about','/contact'];
export async function middleware(req){
  const {pathname}=req.nextUrl;
  const isAdmin=pathname.startsWith('/admin');
  const isCustomerRoute=customerRoutes.some(p=>pathname===p||pathname.startsWith(p+'/'));
  if(!isAdmin&&!isCustomerRoute)return NextResponse.next();
  const token=req.cookies.get('scentora_session')?.value;
  if(!token){
    if(isAdmin)return NextResponse.redirect(new URL('/login',req.url));
    const url=new URL('/login',req.url);
    url.searchParams.set('redirect',pathname+req.nextUrl.search);
    url.searchParams.set('message','Please login or create an account to continue.');
    return NextResponse.redirect(url);
  }
  try{
    await jwtVerify(token,secret);
    return NextResponse.next();
  }catch{
    if(isAdmin)return NextResponse.redirect(new URL('/login',req.url));
    const url=new URL('/login',req.url);
    url.searchParams.set('redirect',pathname+req.nextUrl.search);
    url.searchParams.set('message','Please login or create an account to continue.');
    return NextResponse.redirect(url);
  }
}
export const config={matcher:['/admin/:path*','/shop','/product/:path*','/categories','/branches/:path*','/cart','/checkout','/account','/orders','/about','/contact']};