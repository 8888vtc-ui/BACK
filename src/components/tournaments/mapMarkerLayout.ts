/**
 * @file src/components/tournaments/mapMarkerLayout.ts
 * @description Calcul du positionnement géométrique spiralé et anti-collision des marqueurs sur la carte SVG (1000x500).
 * Strictement <= 120 lignes, 0 any.
 */

export interface RawMarkerNode {
    readonly key: string;
    readonly kind: 'club' | 'tournament';
    readonly id: string;
    readonly slug: string;
    readonly city: string;
    readonly lat: number;
    readonly lng: number;
}

export interface PositionedMarkerNode extends RawMarkerNode {
    readonly svgX: number;
    readonly svgY: number;
    readonly labelDy: number;
}

export function computeSpiralOffsetMarkers(
    nodes: ReadonlyArray<RawMarkerNode>,
    pinScale: number,
): ReadonlyArray<PositionedMarkerNode> {
    const visited = new Set<string>();
    const clusters: Array<RawMarkerNode[]> = [];

    for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i];
        if (!current || visited.has(current.key)) continue;
        const cluster: RawMarkerNode[] = [current];
        visited.add(current.key);

        for (let j = i + 1; j < nodes.length; j++) {
            const candidate = nodes[j];
            if (!candidate || visited.has(candidate.key)) continue;
            const degDist = Math.hypot(current.lat - candidate.lat, current.lng - candidate.lng);
            if (degDist < 0.8) {
                cluster.push(candidate);
                visited.add(candidate.key);
            }
        }
        clusters.push(cluster);
    }

    const positioned: PositionedMarkerNode[] = [];
    for (const cluster of clusters) {
        const count = cluster.length;
        cluster.forEach((node, idx) => {
            const baseSvgX = ((node.lng + 180) / 360) * 1000;
            const baseSvgY = ((90 - node.lat) / 180) * 500;
            let dx = 0;
            let dy = 0;
            if (count > 1) {
                const radius = (count === 2 ? 8.5 : 9.5 + idx * 2.2) * pinScale;
                const angle = count <= 4 ? (idx * 2 * Math.PI) / count - Math.PI / 4 : idx * 2.39996323;
                dx = Math.cos(angle) * radius;
                dy = Math.sin(angle) * radius;
            }
            const cityLower = node.city.toLowerCase();
            let labelDy = dy >= 0 ? 12.5 : -9.5;
            if (cityLower === 'londres' || cityLower === 'london' || cityLower === 'copenhague') {
                labelDy = -12;
            } else if (cityLower === 'paris') {
                labelDy = 12.5;
            } else if (cityLower === 'monte-carlo') {
                labelDy = 13.5;
            }
            positioned.push({
                ...node,
                svgX: Number((baseSvgX + dx).toFixed(2)),
                svgY: Number((baseSvgY + dy).toFixed(2)),
                labelDy,
            });
        });
    }
    return positioned;
}
