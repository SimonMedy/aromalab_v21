"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Trash2, Shield, UserIcon, Plus } from "lucide-react"
import { getAllUsers, deleteUser, updateUser, createUser, type User } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"
import { addActivityLog } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<"admin" | "user">("user")
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user")
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
    loadUsers()
  }, [user, router])

  const loadUsers = () => {
    const data = getAllUsers()
    setUsers(data)
  }

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis.",
        variant: "destructive",
      })
      return
    }

    const result = createUser(newUserEmail, newUserPassword, newUserName, newUserRole)

    if (result.success) {
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Création",
        entity: "user",
        entityId: result.user!.id,
        details: `Utilisateur ${newUserEmail} créé avec le rôle ${newUserRole}`,
      })
      toast({
        title: "Utilisateur créé",
        description: `${newUserEmail} a été créé avec succès.`,
      })
      loadUsers()
      setIsCreateDialogOpen(false)
      setNewUserName("")
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserRole("user")
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Une erreur est survenue.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (userToDelete: User) => {
    if (userToDelete.id === user?.id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive",
      })
      return
    }
    setUserToDelete(userToDelete)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id)
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Suppression",
        entity: "user",
        entityId: userToDelete.id,
        details: `Utilisateur ${userToDelete.email} supprimé`,
      })
      toast({
        title: "Utilisateur supprimé",
        description: `${userToDelete.email} a été supprimé avec succès.`,
        variant: "destructive",
      })
      loadUsers()
    }
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const handleRoleClick = (userToEdit: User) => {
    if (userToEdit.id === user?.id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas modifier votre propre rôle.",
        variant: "destructive",
      })
      return
    }
    setUserToEdit(userToEdit)
    setNewRole(userToEdit.role)
    setIsRoleDialogOpen(true)
  }

  const handleRoleConfirm = () => {
    if (userToEdit) {
      updateUser(userToEdit.id, { role: newRole })
      addActivityLog({
        userId: user!.id,
        userName: user!.name,
        action: "Modification",
        entity: "user",
        entityId: userToEdit.id,
        details: `Rôle de ${userToEdit.email} changé en ${newRole}`,
      })
      toast({
        title: "Rôle modifié",
        description: `Le rôle de ${userToEdit.email} a été mis à jour.`,
      })
      loadUsers()
    }
    setIsRoleDialogOpen(false)
    setUserToEdit(null)
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Gestion des utilisateurs</h1>
          <p className="text-sm md:text-base text-muted-foreground">Administration des comptes et permissions</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {users.length} utilisateur{users.length > 1 ? "s" : ""} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun utilisateur.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}
                        {u.id === user?.id && (
                          <Badge variant="secondary" className="ml-2">
                            Vous
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.role === "admin" ? (
                          <Badge variant="default">
                            <Shield className="mr-1 h-3 w-3" />
                            Administrateur
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserIcon className="mr-1 h-3 w-3" />
                            Utilisateur
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(u.createdAt), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleClick(u)}
                            disabled={u.id === user?.id}
                          >
                            Changer rôle
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(u)}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel utilisateur au système. Un email et un mot de passe seront requis pour la connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                placeholder="Jean Dupont"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@aromalab.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser}>Créer l'utilisateur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <span className="font-semibold">{userToDelete?.email}</span> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changez le rôle de l'utilisateur <span className="font-semibold">{userToEdit?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role">Nouveau rôle</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as "admin" | "user")}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRoleConfirm}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
