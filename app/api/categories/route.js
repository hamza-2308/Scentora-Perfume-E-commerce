import {NextResponse} from 'next/server'; import {db} from '@/lib/db';
export async function GET(){return NextResponse.json(await db.category.findMany({where:{active:true},include:{_count:{select:{products:true}}},orderBy:{name:'asc'}}))}
export async function POST(req){return NextResponse.json(await db.category.create({data:await req.json()}),{status:201})}
