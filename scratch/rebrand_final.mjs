import fs from 'fs';
import path from 'path';

const files = [
  'frontend/app/category/[code]/page.jsx',
  'frontend/app/faq/[slug]/page.jsx',
  'frontend/app/gemini/page.jsx',
  'frontend/app/gta6/Gta6Client.jsx',
  'frontend/app/gta6/page.jsx',
  'frontend/app/lego/page.jsx',
  'frontend/app/market/listing/[id]/page.jsx',
  'frontend/app/payment/failed/PaymentFailedClient.jsx',
  'frontend/app/payment/success/PaymentSuccessClient.jsx',
  'frontend/app/product/[slug]/ProductPageClient.jsx',
  'frontend/app/product/[slug]/layout.jsx',
  'frontend/app/products/ProductsClient.jsx',
  'frontend/app/products/page.jsx',
  'frontend/app/spin/layout.jsx',
  'frontend/app/reseller/catalog/page.jsx',
  'frontend/app/reseller/layout.jsx',
  'frontend/app/reseller/onboarding/page.jsx',
];

const basePath = '/root/jinxfamily';

for (const file of files) {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replacements
    content = content.replace(/جینکس فمیلی/g, 'جینکس فمیلی');
    content = content.replace(/جینکس فمیلی/g, 'جینکس فمیلی');
    content = content.replace(/NubixShop/g, 'JinxFamily');
    content = content.replace(/نوبیکس شاپ/g, 'جینکس فمیلی');
    content = content.replace(/نوبیکس/g, 'جینکس فمیلی');
    content = content.replace(/nubixshop\.ir/g, 'jinxfamily\.shop');
    content = content.replace(/JinxFamily/g, 'JinxFamily');
    content = content.replace(/jinxfamily\.ir/g, 'jinxfamily.shop');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Rebranded file: ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
