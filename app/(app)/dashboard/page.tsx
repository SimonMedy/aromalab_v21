"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Beaker, FlaskConical, Package, TrendingUp } from "lucide-react"
import { getRawMaterials, getFormulas, getManufacturingOrders } from "@/lib/data-store"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    materials: 0,
    formulas: 0,
    orders: 0,
    totalStock: 0,
  })

  useEffect(() => {
    const materials = getRawMaterials()
    const formulas = getFormulas()
    const orders = getManufacturingOrders()

    const totalStock = materials.reduce((sum, m) => sum + m.stock, 0)

    setStats({
      materials: materials.length,
      formulas: formulas.length,
      orders: orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length,
      totalStock,
    })
  }, [])

  const cards = [
    {
      title: "Matières premières",
      value: stats.materials,
      description: "Références actives",
      icon: Beaker,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Formules",
      value: stats.formulas,
      description: "Formules créées",
      icon: FlaskConical,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Ordres en cours",
      value: stats.orders,
      description: "À traiter",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Stock total",
      value: `${stats.totalStock.toFixed(1)} kg`,
      description: "Toutes matières",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-balance sm:text-3xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Vue d'ensemble de votre production</p>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenue sur AromaLab</CardTitle>
            <CardDescription>Votre système de gestion de production d'arômes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Fonctionnalités principales :</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Gestion complète des matières premières (stock, prix, fournisseurs)</li>
                <li>• Création et suivi des formules d'arômes</li>
                <li>• Ordres de fabrication avec déduction automatique du stock</li>
                <li>• Historique complet des activités</li>
                <li>• Gestion des utilisateurs (administrateurs)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Démarrage rapide</CardTitle>
            <CardDescription>Commencez à utiliser l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Étapes recommandées :</h3>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Consultez vos matières premières existantes</li>
                <li>2. Créez votre première formule d'arôme</li>
                <li>3. Lancez un ordre de fabrication</li>
                <li>4. Suivez l'historique des opérations</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
