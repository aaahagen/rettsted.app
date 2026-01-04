'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { updateUserRole } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import LocationList from '@/components/dashboard/LocationList';

function UserTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Rolle</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function DashboardPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect now handles both admin and non-admin loading states
        if (!authLoading) {
            setLoading(false);
        }
    }, [currentUser, authLoading]);

    useEffect(() => {
        if (currentUser?.role !== 'admin') return;

        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData: AppUser[] = [];
            snapshot.forEach(doc => {
                usersData.push({ uid: doc.id, ...doc.data() } as AppUser);
            });
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleRoleChange = async (uid: string, role: 'admin' | 'driver') => {
        try {
            await updateUserRole(uid, role);
            toast({ title: 'Rolle oppdatert', description: 'Brukerens rolle ble endret.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Feil', description: 'Kunne ikke oppdatere rollen.' });
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-full w-full items-center justify-center"><Skeleton className="w-full h-96" /></div>;
    }

    if (currentUser?.role === 'admin') {
        return (
             <div className="grid gap-6">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Adminpanel & Leveringssteder</h1>
                
                {/* Location List for Admin */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Leveringssteder</CardTitle>
                            <CardDescription>Administrer alle leveringssteder.</CardDescription>
                        </div>
                        <Button asChild size="sm" className="h-8 gap-1">
                            <Link href="/dashboard/locations/new">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Nytt Sted
                                </span>
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <LocationList />
                    </CardContent>
                </Card>

                {/* User Management for Admin */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Brukeradministrasjon</CardTitle>
                            <CardDescription>Administrer brukere og deres roller i organisasjonen.</CardDescription>
                        </div>
                        <Button size="sm" className="h-8 gap-1" disabled>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Inviter bruker
                            </span>
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
                                                    <SelectValue placeholder="Velg rolle" />
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
            </div>
        );
    }

    // Default view for non-admins (drivers)
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Leveringssteder</h1>
                <Button asChild size="sm" className="h-8 gap-1">
                    <Link href="/dashboard/locations/new">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Nytt Sted
                        </span>
                    </Link>
                </Button>
            </div>
            <LocationList />
        </div>
    );
}