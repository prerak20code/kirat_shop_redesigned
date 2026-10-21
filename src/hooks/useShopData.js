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
    if (!name.trim()) return
    setData((d) => ({
      ...d,
      products: [...d.products, { id: uid(), name: name.trim(), category: category.trim() }],
    }))
  }, [])

  const addVariant = useCallback((productId, fields) => {
    if (!productId) return
    setData((d) => ({
      ...d,
      variants: [
        ...d.variants,
        {
          id: uid(),
          productId,
          brand: fields.brand.trim(),
          vehicle: fields.vehicle.trim(),
          partNo: fields.partNo.trim(),
          stock: parseInt(fields.stock) || 0,
          minStock: parseInt(fields.minStock) || 0,
        },
      ],
    }))
  }, [])

  const removeVariant = useCallback((variantId) => {
    setData((d) => ({ ...d, variants: d.variants.filter((v) => v.id !== variantId) }))
  }, [])

  const addSupplier = useCallback((name, contact) => {
    if (!name.trim()) return
    setData((d) => ({
      ...d,
      suppliers: [...d.suppliers, { id: uid(), name: name.trim(), contact: contact.trim() }],
    }))
  }, [])

  const removeSupplier = useCallback((supplierId) => {
    setData((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== supplierId) }))
  }, [])

  const addBuyer = useCallback((name, contact) => {
    if (!name.trim()) return
    setData((d) => ({
      ...d,
      buyers: [...d.buyers, { id: uid(), name: name.trim(), contact: contact.trim() }],
    }))
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

  const undoSale = useCallback((saleId) => {
    setData((d) => {
      const s = d.sales.find((x) => x.id === saleId)
      if (!s) return d
      return {
        ...d,
        sales: d.sales.filter((x) => x.id !== saleId),
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
      removeVariant,
      addSupplier,
      removeSupplier,
      addBuyer,
      removeBuyer,
      recordPurchase,
      undoPurchase,
      recordSale,
      undoSale,
    },
  }
}
