'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { updateUserRole, inviteUser } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import LocationList from '@/components/dashboard/LocationList';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
    const { user: currentUser, claims, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for invitation dialog
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'driver'>('driver');
    const [isInviting, setIsInviting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const orgId = claims?.organizationId as string;
        if (currentUser?.role !== 'admin' || !orgId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, 'users'), where('organizationId', '==', orgId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData: AppUser[] = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            } as AppUser));
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, claims]);

    const handleRoleChange = async (uid: string, role: 'admin' | 'driver') => {
        try {
            await updateUserRole(uid, role);
            toast({ title: 'Rolle oppdatert', description: 'Brukerens rolle ble endret.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Feil', description: 'Kunne ikke oppdatere rollen.' });
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const orgId = claims?.organizationId as string;
        const orgName = currentUser?.organizationName || '';

        if (!orgId) return;

        setIsInviting(true);
        try {
            const result = await inviteUser({
                email: inviteEmail,
                role: inviteRole,
                organizationId: orgId,
                organizationName: orgName
            });

            if (result.success) {
                setGeneratedLink(result.resetLink || null);
                // Corrected toast message to be accurate
                toast({ 
                    title: 'Invitasjonslenke klar', 
                    description: `Lenken for ${inviteEmail} er generert og klar til å kopieres.` 
                });
                setInviteEmail('');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Invitasjon feilet', description: error.message });
        } finally {
            setIsInviting(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast({ title: 'Lenke kopiert!', description: 'Du kan nå lime den inn i en e-post eller melding.' });
            setTimeout(() => setCopied(false), 3000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            toast({ 
                variant: 'destructive', 
                title: 'Kunne ikke kopiere', 
                description: 'Vennligst marker og kopier lenken manuelt fra feltet.' 
            });
        }
    };

    if (authLoading || (currentUser?.role === 'admin' && loading)) {
        return <div className="flex h-full w-full items-center justify-center p-12"><Skeleton className="w-full h-96" /></div>;
    }

    if (currentUser?.role === 'admin') {
        return (
             <div className="grid gap-6">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Adminpanel & Leveringssteder</h1>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Leveringssteder</CardTitle>
                            <CardDescription>Administrer alle leveringssteder for {currentUser.organizationName}.</CardDescription>
                        </div>
                        <Button asChild size="sm" className="h-8 gap-1">
                            <Link href="/dashboard/locations/new">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nytt Sted</span>
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <LocationList />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Brukeradministrasjon</CardTitle>
                            <CardDescription>Administrer brukere og roller i din organisasjon.</CardDescription>
                        </div>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setIsInviteOpen(true)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Inviter bruker</span>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Navn</TableHead>
                                    <TableHead className="hidden sm:table-cell">E-post</TableHead>
                                    <TableHead>Rolle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.displayName}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={user.role}
                                                onValueChange={(value: 'admin' | 'driver') => handleRoleChange(user.uid, value)}
                                                disabled={user.uid === currentUser.uid}
                                            >
                                                <SelectTrigger className="w-[110px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="driver">Sjåfør</SelectItem>
                                                    <SelectItem value="admin">Leder</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isInviteOpen} onOpenChange={(open) => {
                    setIsInviteOpen(open);
                    if (!open) {
                        setGeneratedLink(null);
                        setInviteEmail('');
                    }
                }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Inviter ny bruker</DialogTitle>
                            <DialogDescription>
                                Opprett en konto for en kollega. Du må sende lenken til dem manuelt.
                            </DialogDescription>
                        </DialogHeader>

                        {!generatedLink ? (
                            <form onSubmit={handleInvite} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">E-postadresse</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="bruker@eksempel.no" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Rolle</Label>
                                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                        <SelectTrigger id="role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="driver">Sjåfør (Kun lesetilgang)</SelectItem>
                                            <SelectItem value="admin">Leder (Full tilgang)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={isInviting || !inviteEmail}>
                                    {isInviting ? 'Oppretter...' : 'Generer invitasjonslenke'}
                                </Button>
                            </form>
                        ) : (
                            <div className="py-6 space-y-4">
                                <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-primary/20 space-y-3">
                                    <p className="text-sm font-semibold text-center">Invitasjonslenken er klar!</p>
                                    <p className="text-xs text-muted-foreground text-center">Kopier lenken under og send den til den nye brukeren:</p>
                                    <div className="flex gap-2">
                                        <Input 
                                            readOnly 
                                            value={generatedLink} 
                                            className="text-xs font-mono bg-background" 
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                        />
                                        <Button 
                                            size="icon" 
                                            variant={copied ? "default" : "secondary"}
                                            onClick={() => copyToClipboard(generatedLink)}
                                        >
                                            {copied ? <Check className="h-4 w-4 text-primary-foreground" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <Button className="w-full" variant="outline" onClick={() => setIsInviteOpen(false)}>Lukk vindu</Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Leveringssteder</h1>
            </div>
            <LocationList />
        </div>
    );
}
