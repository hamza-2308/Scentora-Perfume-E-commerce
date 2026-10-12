import {NextResponse} from 'next/server'; import {db} from '@/lib/db'; import {getUser} from '@/lib/auth';
// Server-side check for an Add to Cart action. Requires the existing session; price/name/image come from the DB, never from the client.
export async function POST(req){
  const user=await getUser();
  if(!user)return NextResponse.json({error:'Please login or create an account to add items to your cart.'},{status:401});
  let b;try{b=await req.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
  const productId=b?.productId;const quantity=Number(b?.quantity??1);
  if(typeof productId!=='string'||!productId||productId.length>64)return NextResponse.json({error:'Invalid product'},{status:400});
  if(!Number.isInteger(quantity)||quantity<1||quantity>10)return NextResponse.json({error:'Quantity must be a whole number between 1 and 10'},{status:400});
  try{
    const p=await db.product.findUnique({where:{id:productId},include:{inventories:true}});
    if(!p||!p.active)return NextResponse.json({error:'This product is no longer available'},{status:404});
    const stock=p.inventories.reduce((s,i)=>s+i.stock,0);
    if(stock<1)return NextResponse.json({error:`${p.name} is out of stock`},{status:409});
    if(stock<quantity)return NextResponse.json({error:`Only ${stock} of ${p.name} in stock`},{status:409});
    return NextResponse.json({user:{id:user.sub,email:user.email,role:user.role},product:{id:p.id,name:p.name,price:Number(p.price),discount:Number(p.discount),imageUrl:p.imageUrl}});
  }catch{return NextResponse.json({error:'Could not add to cart. Please try again.'},{status:500})}
}
