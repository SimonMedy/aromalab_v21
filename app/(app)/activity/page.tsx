"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Beaker, FlaskConical, Package, Users } from "lucide-react"
import { getActivityLog, type ActivityLog } from "@/lib/data-store"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadActivities()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredActivities(activities)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = activities.filter(
        (a) =>
          a.userName.toLowerCase().includes(query) ||
          a.action.toLowerCase().includes(query) ||
          a.details.toLowerCase().includes(query),
      )
      setFilteredActivities(filtered)
    }
  }, [searchQuery, activities])

  const loadActivities = () => {
    const data = getActivityLog()
    setActivities(data)
    setFilteredActivities(data)
  }

  const getEntityIcon = (entity: ActivityLog["entity"]) => {
    switch (entity) {
      case "material":
        return <Beaker className="h-4 w-4" />
      case "formula":
        return <FlaskConical className="h-4 w-4" />
      case "order":
        return <Package className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
    }
  }

  const getEntityLabel = (entity: ActivityLog["entity"]) => {
    switch (entity) {
      case "material":
        return "Matière première"
      case "formula":
        return "Formule"
      case "order":
        return "Ordre"
      case "user":
        return "Utilisateur"
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes("Création")) return "default"
    if (action.includes("Modification")) return "secondary"
    if (action.includes("Suppression") || action.includes("Annulation")) return "destructive"
    if (action.includes("Complétion")) return "secondary"
    return "default"
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-balance">Historique des activités</h1>
        <p className="text-sm md:text-base text-muted-foreground">Suivi de toutes les actions dans l'application</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle>Journal d'activité</CardTitle>
              <CardDescription>
                {filteredActivities.length} activité{filteredActivities.length > 1 ? "s" : ""} enregistrée
                {filteredActivities.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {searchQuery ? "Aucun résultat trouvé." : "Aucune activité enregistrée."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {getEntityIcon(activity.entity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(activity.action)}>{activity.action}</Badge>
                      <Badge variant="outline">{getEntityLabel(activity.entity)}</Badge>
                    </div>
                    <p className="text-sm font-medium">{activity.details}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{activity.userName}</span>
                      <span>•</span>
                      <span>{format(new Date(activity.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
