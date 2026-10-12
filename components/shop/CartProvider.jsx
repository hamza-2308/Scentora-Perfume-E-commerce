'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {useRouter,usePathname} from 'next/navigation';

const C=createContext();
const MAX_QTY=10;
const keyFor=id=>`scentora-cart:${id}`; // cart is stored per authenticated user, never shared between accounts
const readStore=id=>{try{const v=JSON.parse(localStorage.getItem(keyFor(id))||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
const merge=(list,p,n)=>{const x=list.find(i=>i.id===p.id);return x?list.map(i=>i.id===p.id?{...i,qty:i.qty+n}:i):[...list,{...p,qty:n}]};

export function CartProvider({children}){
  const router=useRouter();
  const pathname=usePathname();
  const [user,setUser]=useState(undefined); // undefined = still checking, null = guest
  const [cart,setCart]=useState({uid:null,items:[]});
  const [toast,setToast]=useState(null);
  const timer=useRef(null);
  const uid=user?user.id:null;
  const items=uid&&cart.uid===uid?cart.items:[];

  const notify=useCallback((message,type='success')=>{setToast({message,type});clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(null),3500)},[]);

  const refreshUser=useCallback(async()=>{
    try{const r=await fetch('/api/auth/me',{cache:'no-store',credentials:'same-origin'});const d=r.ok?await r.json():null;const u=d?.user||null;setUser(u);return u}
    catch{setUser(null);return null}
  },[]);
  useEffect(()=>{refreshUser()},[refreshUser]);

  useEffect(()=>{if(uid)setCart(c=>c.uid===uid?c:{uid,items:readStore(uid)})},[uid]);
  useEffect(()=>{if(uid&&cart.uid===uid){try{localStorage.setItem(keyFor(uid),JSON.stringify(cart.items))}catch{}}},[cart,uid]);

  const mutate=fn=>setCart(c=>uid&&c.uid===uid?{...c,items:fn(c.items)}:c);
  const add=(p,n=1)=>mutate(a=>merge(a,p,n));
  const remove=id=>mutate(a=>a.filter(i=>i.id!==id));
  const qty=(id,q)=>mutate(a=>a.map(i=>i.id===id?{...i,qty:Math.max(1,q)}:i));
  const clear=()=>mutate(()=>[]);

  // Single entry point for every Add to Cart button and for the post-login replay.
  // Not logged in -> go to /login carrying only productId + quantity (non-sensitive) and the page to come back to.
  const addToCart=useCallback(async(productId,quantity=1,opts={})=>{
    const q=Number(quantity);
    if(typeof productId!=='string'||!productId||!Number.isInteger(q)||q<1||q>MAX_QTY){notify('Invalid product or quantity.','error');return{ok:false}}
    let res,data;
    try{res=await fetch('/api/cart/validate',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,quantity:q})});data=await res.json().catch(()=>({}))}
    catch{notify('Network error. Please try again.','error');return{ok:false}}
    if(res.status===401){
      setUser(null);
      if(!opts.noRedirect){
        const back=pathname||'/';
        const sp=new URLSearchParams({redirect:back,action:'add-to-cart',productId,quantity:String(q),message:'Please login or create an account to add this item to your cart.'});
        router.push(`/login?${sp.toString()}`);
      }
      return{ok:false,needsAuth:true};
    }
    if(!res.ok){notify(data.error||'Could not add to cart.','error');return{ok:false}}
    const du=data.user;
    setUser(prev=>prev&&prev.id===du.id?prev:du);
    setCart(c=>({uid:du.id,items:merge(c.uid===du.id?c.items:readStore(du.id),data.product,q)}));
    notify(`${data.product.name} added to cart`);
    return{ok:true};
  },[notify,pathname,router]);

  const total=items.reduce((s,i)=>s+i.price*(1-i.discount/100)*i.qty,0);
  return <C.Provider value={{items,add,remove,qty,clear,total,user,refreshUser,addToCart}}>
    {children}
    {toast&&<div role="status" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm font-bold text-white shadow-lg ${toast.type==='error'?'bg-red-600':'bg-[#17120f]'}`}>{toast.message}</div>}
  </C.Provider>
}
export const useCart=()=>useContext(C);
