const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const search1 = `          const parsedItems = result.data.map((item: any) => {
            const searchName = (item.productName || '').trim().toLowerCase();
            let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
            if (!matchedProduct) {
              const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
              matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
            }
            return {
              productName: matchedProduct ? matchedProduct.name : item.productName || '',
              quantity: item.quantity ? item.quantity.toString() : ''
            };
          }).filter((item: any) => item.productName);
          
          setStockInItems(prev => [...prev, ...parsedItems]);`;

const replace1 = `          const parsedItems = result.data.map((item: any) => {
            const searchName = (item.productName || '').trim().toLowerCase();
            let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
            if (!matchedProduct) {
              const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
              matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
            }
            return {
              productName: matchedProduct ? matchedProduct.name : item.productName || '',
              quantity: item.quantity ? item.quantity.toString() : ''
            };
          }).filter((item: any) => item.productName);
          
          const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
            const existing = acc.find(item => item.productName === current.productName);
            if (existing) {
              existing.quantity = ((Number(existing.quantity) || 0) + (Number(current.quantity) || 0)).toString();
            } else {
              acc.push(current);
            }
            return acc;
          }, []);
          
          setStockInItems(prev => {
            const newArray = [...prev];
            aggregatedItems.forEach(aggItem => {
              const existingInPrev = newArray.find(p => p.productName === aggItem.productName);
              if (existingInPrev) {
                existingInPrev.quantity = ((Number(existingInPrev.quantity) || 0) + (Number(aggItem.quantity) || 0)).toString();
              } else {
                newArray.push(aggItem);
              }
            });
            return newArray;
          });`;

const search2 = `      const parsedItems = result.data.map((item: any) => {
        // match product
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }
        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };
      });
      
      setAiScannerResults(parsedItems);`;

const replace2 = `      const parsedItems = result.data.map((item: any) => {
        // match product
        const searchName = (item.productName || '').trim().toLowerCase();
        let matchedProduct = products.find(p => p.name.toLowerCase() === searchName);
        if (!matchedProduct) {
          const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
          matchedProduct = sortedProducts.find(p => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
        }
        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity || 0,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };
      });
      
      const aggregatedItems = parsedItems.reduce((acc: any[], current: any) => {
        const existing = acc.find(item => item.productName === current.productName);
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + (Number(current.quantity) || 0);
          if (current.description) {
            existing.description = existing.description ? existing.description + ", " + current.description : current.description;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setAiScannerResults(aggregatedItems);`;

content = content.replace(search1, replace1);
content = content.replace(search2, replace2);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Updated AdminDashboard.tsx');
