import {NextResponse} from 'next/server'; import {db} from '@/lib/db';
export async function GET(){const bs=await db.branch.findMany({where:{active:true},include:{inventories:{include:{product:true}},_count:{select:{orders:true}}}});return NextResponse.json(bs)}
export async function POST(req){return NextResponse.json(await db.branch.create({data:await req.json()}),{status:201})}
