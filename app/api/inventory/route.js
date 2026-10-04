import {NextResponse} from 'next/server'; import {db} from '@/lib/db';
export async function GET(){return NextResponse.json(await db.inventory.findMany({include:{product:true,branch:true},orderBy:{updatedAt:'desc'}}))}
export async function PATCH(req){const {id,stock}=await req.json();return NextResponse.json(await db.inventory.update({where:{id},data:{stock:Number(stock)}}))}
