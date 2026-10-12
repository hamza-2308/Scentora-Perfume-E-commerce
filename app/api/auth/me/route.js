import {NextResponse} from 'next/server'; import {getUser} from '@/lib/auth';
export async function GET(){const u=await getUser();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({user:{id:u.sub,email:u.email,role:u.role,name:u.name||null,avatar:u.avatar||null}})}
