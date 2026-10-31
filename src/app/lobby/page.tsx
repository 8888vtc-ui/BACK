import { redirect } from 'next/navigation';

interface LobbyRedirectPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LobbyRedirectPage(props: LobbyRedirectPageProps) {
    const resolved = props.searchParams ? await props.searchParams : {};
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(resolved)) {
        if (typeof v === 'string') {
            params.set(k, v);
        } else if (Array.isArray(v) && v[0]) {
            params.set(k, v[0]);
        }
    }
    const qs = params.toString();
    redirect(qs ? `/?${qs}` : '/');
}

