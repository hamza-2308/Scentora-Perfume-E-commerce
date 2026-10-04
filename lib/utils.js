export const money=(n)=>`Rs. ${Number(n||0).toLocaleString('en-PK',{maximumFractionDigits:0})}`;
export const slugify=(s)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
