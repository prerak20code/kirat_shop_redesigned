import { useCallback, useEffect, useRef, useState } from 'react'
import { loadState, saveState, emptyState } from '../services/dataService'
import { uid } from '../lib/ids'
import { todayStr } from '../lib/format'

// One hook, one source of truth. Every page reads `data` and calls one of
// the action functions below to change it — nothing mutates state directly.
export function useShopData() {
  const [data, setData] = useState(emptyState)
  const [saveStatus, setSaveStatus] = useState('loading') // loading | ready | saving | saved | err
  const saveTimer = useRef(null)
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    loadState()
      .then((s) => {
        if (cancelled) return
        setData(s)
        loaded.current = true
        setSaveStatus('ready')
      })
      .catch((error) => {
        console.error('useShopData could not load the workspace', error)
        if (cancelled) return
        loaded.current = true
        setSaveStatus('err')
      })
    return () => {
      cancelled = true
      clearTimeout(saveTimer.current)
    }
  }, [])

  // Debounced save whenever data changes, after the initial load completes.
  useEffect(() => {
    if (!loaded.current) return
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const ok = await saveState(data)
        setSaveStatus(ok ? 'saved' : 'err')
      } catch (error) {
        console.error('useShopData could not save the workspace', error)
        setSaveStatus('err')
      }
    }, 200)
    return () => clearTimeout(saveTimer.current)
  }, [data])

  const addProduct = useCallback((name, category) => {
    if (!name.trim()) return null
    const id = uid()
    setData((d) => ({
      ...d,
      products: [...d.products, { id, name: name.trim(), category: (category || '').trim() }],
    }))
    return id
  }, [])

  const addVariant = useCallback((productId, fields) => {
    if (!productId) return null
    const id = uid()
    setData((d) => ({
      ...d,
      variants: [
        ...d.variants,
        {
          id,
          productId,
          brand: (fields.brand || '').trim(),
          vehicle: (fields.vehicle || '').trim(),
          partNo: (fields.partNo || '').trim(),
          barcode: (fields.barcode || '').trim(),
          stock: parseInt(fields.stock, 10) || 0,
          minStock: parseInt(fields.minStock, 10) || 0,
        },
      ],
    }))
    return id
  }, [])

  const addProductWithVariant = useCallback((fields) => {
    const newProductId = fields.productId || uid()
    const newVariantId = uid()
    setData((d) => {
      const nextProducts = fields.productId
        ? d.products
        : [
            ...d.products,
            {
              id: newProductId,
              name: (fields.newProductName || '').trim(),
              category: (fields.newProductCategory || '').trim(),
            },
          ]
      return {
        ...d,
        products: nextProducts,
        variants: [
          ...d.variants,
          {
            id: newVariantId,
            productId: newProductId,
            brand: (fields.brand || '').trim(),
            vehicle: (fields.vehicle || '').trim(),
            partNo: (fields.partNo || '').trim(),
            barcode: (fields.barcode || '').trim(),
            stock: parseInt(fields.stock, 10) || 0,
            minStock: parseInt(fields.minStock, 10) || 0,
          },
        ],
      }
    })
    return { productId: newProductId, variantId: newVariantId }
  }, [])

  const updateVariantBarcode = useCallback((variantId, barcode) => {
    if (!variantId) return
    const clean = String(barcode || '').trim()
    setData((d) => ({
      ...d,
      variants: d.variants.map((v) =>
        v.id === variantId ? { ...v, barcode: clean } : v
      ),
    }))
  }, [])

  const removeVariant = useCallback((variantId) => {
    setData((d) => ({ ...d, variants: d.variants.filter((v) => v.id !== variantId) }))
  }, [])

  const addSupplier = useCallback((name, contact) => {
    if (!name.trim()) return null
    const id = uid()
    setData((d) => ({
      ...d,
      suppliers: [...d.suppliers, { id, name: name.trim(), contact: (contact || '').trim() }],
    }))
    return id
  }, [])

  const removeSupplier = useCallback((supplierId) => {
    setData((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== supplierId) }))
  }, [])

  const addBuyer = useCallback((name, contact) => {
    if (!name.trim()) return null
    const id = uid()
    setData((d) => ({
      ...d,
      buyers: [...d.buyers, { id, name: name.trim(), contact: (contact || '').trim() }],
    }))
    return id
  }, [])

  const removeBuyer = useCallback((buyerId) => {
    setData((d) => ({ ...d, buyers: d.buyers.filter((b) => b.id !== buyerId) }))
  }, [])

  const recordPurchase = useCallback(({ supplierId, variantId, cost, qty, date }) => {
    if (!supplierId || !variantId) return
    setData((d) => ({
      ...d,
      purchases: [
        ...d.purchases,
        { id: uid(), supplierId, variantId, cost, qty, date: date || todayStr() },
      ],
      variants: d.variants.map((v) => (v.id === variantId ? { ...v, stock: v.stock + qty } : v)),
    }))
  }, [])

  const recordPurchasesBatch = useCallback(({ supplierId, date, items }) => {
    if (!supplierId || !Array.isArray(items) || items.length === 0) return
    const purchaseDate = date || todayStr()
    setData((d) => {
      const qtyByVariant = new Map()
      const newPurchases = items.map((item) => {
        qtyByVariant.set(
          item.variantId,
          (qtyByVariant.get(item.variantId) || 0) + item.qty
        )
        return {
          id: uid(),
          supplierId,
          variantId: item.variantId,
          cost: item.cost,
          qty: item.qty,
          date: purchaseDate,
        }
      })
      return {
        ...d,
        purchases: [...d.purchases, ...newPurchases],
        variants: d.variants.map((v) =>
          qtyByVariant.has(v.id)
            ? { ...v, stock: v.stock + qtyByVariant.get(v.id) }
            : v
        ),
      }
    })
  }, [])

  const undoPurchase = useCallback((purchaseId) => {
    setData((d) => {
      const p = d.purchases.find((x) => x.id === purchaseId)
      if (!p) return d
      return {
        ...d,
        purchases: d.purchases.filter((x) => x.id !== purchaseId),
        variants: d.variants.map((v) =>
          v.id === p.variantId ? { ...v, stock: v.stock - p.qty } : v
        ),
      }
    })
  }, [])

  const recordSale = useCallback(({ buyerId, variantId, price, qty, date }) => {
    if (!buyerId || !variantId) return
    setData((d) => ({
      ...d,
      sales: [...d.sales, { id: uid(), buyerId, variantId, price, qty, date: date || todayStr() }],
      variants: d.variants.map((v) => (v.id === variantId ? { ...v, stock: v.stock - qty } : v)),
    }))
  }, [])

  const recordBill = useCallback(({ buyerId, date, invoiceNo, items }) => {
    if (!buyerId || !Array.isArray(items) || items.length === 0) return null
    const billId = uid()
    const billDate = date || todayStr()
    const cleanItems = items.map((item) => ({
      variantId: item.variantId,
      qty: Number(item.qty) || 0,
      price: Number(item.price) || 0,
    }))
    const totalUnits = cleanItems.reduce((sum, x) => sum + x.qty, 0)
    const totalAmount = cleanItems.reduce((sum, x) => sum + x.qty * x.price, 0)
    const billRecord = {
      id: billId,
      invoiceNo,
      buyerId,
      date: billDate,
      items: cleanItems,
      totalUnits,
      totalAmount,
    }

    setData((d) => {
      const qtyByVariant = new Map()
      const newSales = cleanItems.map((item) => {
        qtyByVariant.set(
          item.variantId,
          (qtyByVariant.get(item.variantId) || 0) + item.qty
        )
        return {
          id: uid(),
          billId,
          invoiceNo,
          buyerId,
          variantId: item.variantId,
          price: item.price,
          qty: item.qty,
          date: billDate,
        }
      })
      return {
        ...d,
        bills: [...(d.bills || []), billRecord],
        sales: [...d.sales, ...newSales],
        variants: d.variants.map((v) =>
          qtyByVariant.has(v.id)
            ? { ...v, stock: v.stock - qtyByVariant.get(v.id) }
            : v
        ),
      }
    })

    return billRecord
  }, [])

  const undoBill = useCallback((billId) => {
    setData((d) => {
      const billSales = d.sales.filter((s) => s.billId === billId)
      const bill = (d.bills || []).find((b) => b.id === billId)
      if (!bill && billSales.length === 0) return d

      const restoreByVariant = new Map()
      const sourceItems = billSales.length > 0 ? billSales : bill?.items || []
      for (const item of sourceItems) {
        restoreByVariant.set(
          item.variantId,
          (restoreByVariant.get(item.variantId) || 0) + (Number(item.qty) || 0)
        )
      }

      return {
        ...d,
        bills: (d.bills || []).filter((b) => b.id !== billId),
        sales: d.sales.filter((s) => s.billId !== billId),
        variants: d.variants.map((v) =>
          restoreByVariant.has(v.id)
            ? { ...v, stock: v.stock + restoreByVariant.get(v.id) }
            : v
        ),
      }
    })
  }, [])

  const undoSale = useCallback((saleId) => {
    setData((d) => {
      const s = d.sales.find((x) => x.id === saleId)
      if (!s) return d
      const nextSales = d.sales.filter((x) => x.id !== saleId)
      const nextBills = s.billId
        ? (d.bills || [])
            .map((b) => {
              if (b.id !== s.billId) return b
              const remainingSales = nextSales.filter((x) => x.billId === b.id)
              if (remainingSales.length === 0) return null
              return {
                ...b,
                items: remainingSales.map((x) => ({
                  variantId: x.variantId,
                  qty: x.qty,
                  price: x.price,
                })),
                totalUnits: remainingSales.reduce((sum, x) => sum + x.qty, 0),
                totalAmount: remainingSales.reduce((sum, x) => sum + x.qty * x.price, 0),
              }
            })
            .filter(Boolean)
        : d.bills || []

      return {
        ...d,
        bills: nextBills,
        sales: nextSales,
        variants: d.variants.map((v) =>
          v.id === s.variantId ? { ...v, stock: v.stock + s.qty } : v
        ),
      }
    })
  }, [])

  return {
    data,
    saveStatus,
    actions: {
      addProduct,
      addVariant,
      addProductWithVariant,
      updateVariantBarcode,
      removeVariant,
      addSupplier,
      removeSupplier,
      addBuyer,
      removeBuyer,
      recordPurchase,
      recordPurchasesBatch,
      undoPurchase,
      recordSale,
      recordBill,
      undoBill,
      undoSale,
    },
  }
}
