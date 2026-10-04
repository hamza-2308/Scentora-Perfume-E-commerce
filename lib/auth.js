import {cookies} from 'next/headers'; import {jwtVerify,SignJWT} from 'jose';
const secret=new TextEncoder().encode(process.env.AUTH_SECRET||'dev-secret-change-me');
export async function signUser(user){return new SignJWT({sub:user.id,email:user.email,role:user.role,branchId:user.branchId}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret)}
export async function getUser(){const c=await cookies(); const token=c.get('scentora_session')?.value;if(!token)return null;try{return (await jwtVerify(token,secret)).payload}catch{return null}}
export async function requireAdmin(){const u=await getUser();if(!u||!['SUPER_ADMIN','BRANCH_MANAGER','STAFF'].includes(u.role))throw new Error('UNAUTHORIZED');return u}
