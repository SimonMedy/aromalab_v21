// Data management utilities
export interface RawMaterial {
  id: string
  code: string // Now stores just the number: "1", "2", "3" instead of "MP1", "MP2", "MP3"
  designation: string
  cas: string
  supplier: string
  stock: number // in kg
  price: number // per kg
  createdAt: string
  updatedAt: string
}

export interface FormulaIngredient {
  materialId: string
  quantity: number // in kg (total should be 100kg)
}

export interface Formula {
  id: string
  code: string // Now stores just the number: "1", "2", "3" instead of "F1", "F2", "F3"
  name: string
  description: string
  ingredients: FormulaIngredient[]
  totalWeight: number // should be 100kg
  createdAt: string
  updatedAt: string
}

export interface ManufacturingOrder {
  id: string
  orderNumber: string
  formulaId: string
  coefficient: number // multiplier for the formula
  status: "pending" | "in-progress" | "completed" | "cancelled"
  createdBy: string
  createdAt: string
  completedAt?: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: "material" | "formula" | "order" | "user"
  entityId: string
  details: string
  timestamp: string
}

const MATERIALS_KEY = "aromalab_materials"
const FORMULAS_KEY = "aromalab_formulas"
const ORDERS_KEY = "aromalab_orders"
const ACTIVITY_KEY = "aromalab_activity"

export const formatMaterialCode = (code: string) => `MP${code}`
export const formatFormulaCode = (code: string) => `F${code}`

export const getNextMaterialCode = (): string => {
  const materials = getRawMaterials()
  if (materials.length === 0) return "1"
  const maxCode = Math.max(...materials.map((m) => Number.parseInt(m.code) || 0))
  return String(maxCode + 1)
}

export const getNextFormulaCode = (): string => {
  const formulas = getFormulas()
  if (formulas.length === 0) return "1"
  const maxCode = Math.max(...formulas.map((f) => Number.parseInt(f.code) || 0))
  return String(maxCode + 1)
}

// Initialize with sample data
const initializeData = () => {
  if (!localStorage.getItem(MATERIALS_KEY)) {
    const sampleMaterials: RawMaterial[] = [
      {
        id: "1",
        code: "1", // Changed from "MP1" to "1"
        designation: "Vanilline",
        cas: "121-33-5",
        supplier: "Givaudan",
        stock: 250,
        price: 45.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        code: "2", // Changed from "MP2" to "2"
        designation: "Éthyl Maltol",
        cas: "4940-11-8",
        supplier: "Symrise",
        stock: 180,
        price: 62.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        code: "3", // Changed from "MP3" to "3"
        designation: "Menthol",
        cas: "2216-51-5",
        supplier: "Firmenich",
        stock: 320,
        price: 38.75,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(sampleMaterials))
  }

  if (!localStorage.getItem(FORMULAS_KEY)) {
    localStorage.setItem(FORMULAS_KEY, JSON.stringify([]))
  }

  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]))
  }

  if (!localStorage.getItem(ACTIVITY_KEY)) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify([]))
  }
}

// Raw Materials
export const getRawMaterials = (): RawMaterial[] => {
  initializeData()
  return JSON.parse(localStorage.getItem(MATERIALS_KEY) || "[]")
}

export const addRawMaterial = (material: Omit<RawMaterial, "id" | "createdAt" | "updatedAt">): RawMaterial => {
  const materials = getRawMaterials()
  const newMaterial: RawMaterial = {
    ...material,
    id: Date.now().toString(),
    code: getNextMaterialCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  materials.push(newMaterial)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
  return newMaterial
}

export const updateRawMaterial = (id: string, updates: Partial<RawMaterial>): boolean => {
  const materials = getRawMaterials()
  const index = materials.findIndex((m) => m.id === id)

  if (index !== -1) {
    materials[index] = { ...materials[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
    return true
  }
  return false
}

export const deleteRawMaterial = (id: string): boolean => {
  const materials = getRawMaterials()
  const filtered = materials.filter((m) => m.id !== id)

  if (filtered.length < materials.length) {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(filtered))
    return true
  }
  return false
}

export const getFormulasUsingMaterial = (materialId: string): Formula[] => {
  const formulas = getFormulas()
  return formulas.filter((formula) => formula.ingredients.some((ingredient) => ingredient.materialId === materialId))
}

// Formulas
export const getFormulas = (): Formula[] => {
  initializeData()
  return JSON.parse(localStorage.getItem(FORMULAS_KEY) || "[]")
}

export const addFormula = (formula: Omit<Formula, "id" | "createdAt" | "updatedAt">): Formula => {
  const formulas = getFormulas()
  const newFormula: Formula = {
    ...formula,
    id: Date.now().toString(),
    code: getNextFormulaCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  formulas.push(newFormula)
  localStorage.setItem(FORMULAS_KEY, JSON.stringify(formulas))
  return newFormula
}

export const updateFormula = (id: string, updates: Partial<Formula>): boolean => {
  const formulas = getFormulas()
  const index = formulas.findIndex((f) => f.id === id)

  if (index !== -1) {
    formulas[index] = { ...formulas[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(FORMULAS_KEY, JSON.stringify(formulas))
    return true
  }
  return false
}

export const deleteFormula = (id: string): boolean => {
  const formulas = getFormulas()
  const filtered = formulas.filter((f) => f.id !== id)

  if (filtered.length < formulas.length) {
    localStorage.setItem(FORMULAS_KEY, JSON.stringify(filtered))
    return true
  }
  return false
}

// Manufacturing Orders
export const getManufacturingOrders = (): ManufacturingOrder[] => {
  initializeData()
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")
}

export const addManufacturingOrder = (
  order: Omit<ManufacturingOrder, "id" | "orderNumber" | "createdAt">,
): ManufacturingOrder => {
  const orders = getManufacturingOrders()
  const orderNumber = `OF${(orders.length + 1).toString().padStart(4, "0")}`

  const newOrder: ManufacturingOrder = {
    ...order,
    id: Date.now().toString(),
    orderNumber,
    createdAt: new Date().toISOString(),
  }
  orders.push(newOrder)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  return newOrder
}

export const updateManufacturingOrder = (id: string, updates: Partial<ManufacturingOrder>): boolean => {
  const orders = getManufacturingOrders()
  const index = orders.findIndex((o) => o.id === id)

  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    return true
  }
  return false
}

export const completeManufacturingOrder = (orderId: string): boolean => {
  const orders = getManufacturingOrders()
  const order = orders.find((o) => o.id === orderId)

  if (!order) return false

  const formulas = getFormulas()
  const formula = formulas.find((f) => f.id === order.formulaId)

  if (!formula) return false

  // Deduct stock based on coefficient
  const materials = getRawMaterials()
  formula.ingredients.forEach((ingredient) => {
    const material = materials.find((m) => m.id === ingredient.materialId)
    if (material) {
      material.stock -= ingredient.quantity * order.coefficient
      updateRawMaterial(material.id, { stock: material.stock })
    }
  })

  // Update order status
  updateManufacturingOrder(orderId, {
    status: "completed",
    completedAt: new Date().toISOString(),
  })

  return true
}

// Activity Log
export const getActivityLog = (): ActivityLog[] => {
  initializeData()
  return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]")
}

export const addActivityLog = (log: Omit<ActivityLog, "id" | "timestamp">): void => {
  const logs = getActivityLog()
  const newLog: ActivityLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  }
  logs.unshift(newLog) // Add to beginning
  // Keep only last 100 logs
  const trimmedLogs = logs.slice(0, 100)
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmedLogs))
}
