'use client';
import {useState} from 'react';
import {useCart} from '@/components/shop/CartProvider';

export default function AddToCartButton({productId,quantity=1,className='btn btn-gold w-full mt-2',children='Add to Cart',onAdded}){
  const {addToCart}=useCart();
  const [busy,setBusy]=useState(false);
  return <button type="button" disabled={busy} className={className} onClick={async()=>{setBusy(true);const r=await addToCart(productId,quantity);setBusy(false);if(r.ok&&onAdded)onAdded()}}>{children}</button>
}
