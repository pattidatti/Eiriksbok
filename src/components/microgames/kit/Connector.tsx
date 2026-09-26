import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { microSfx } from './sound';

// Forbind punkter ved å klikke A så B: handelsrute, kabel, akvedukt, forsyningslinje,
// slektsledd. En "rute/koble"-mekanikk som bryter klikk-hotspot-ruten. Med `correct`
// valideres hver forbindelse (grønn/rød) og onComplete fyrer når alle riktige er laget.
//
//   <Connector
//       nodes={[{ id: 'oslo', position: [-4,0.4,2] }, { id: 'bergen', position: [3,0.4,-1] }]}
//       correct={[['oslo', 'bergen']]}
//       onComplete={() => win()}
//   />

export interface ConnectorNode {
    id: string;
    position: [number, number, number];
    label?: string;
    color?: string;
}

interface Connection {
    a: string;
    b: string;
    valid: boolean;
}

interface ConnectorProps {
    nodes: ConnectorNode[];
    // Korrekte par (uordnet). Utelatt = fri forbinding uten validering.
    correct?: [string, string][];
    nodeRadius?: number;
    linkRadius?: number;
    onConnect?: (a: string, b: string, valid: boolean) => void;
    onComplete?: () => void;
}

function samePair(a1: string, b1: string, a2: string, b2: string): boolean {
    return (a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2);
}

// En sylinder-lenke mellom to verdenspunkter (mer "3D" enn en pixel-linje).
function Link({
    from,
    to,
    color,
    radius,
}: {
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    radius: number;
}) {
    const { position, quaternion, length } = useMemo(() => {
        const a = new THREE.Vector3(...from);
        const b = new THREE.Vector3(...to);
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        // Sylinderen peker langs +Y som standard; roter den til å følge dir.
        const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        return { position: mid, quaternion: q, length: len };
    }, [from, to]);

    return (
        <mesh position={position} quaternion={quaternion} castShadow>
            <cylinderGeometry args={[radius, radius, length, 10]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.25}
                roughness={0.5}
            />
        </mesh>
    );
}

export const Connector: React.FC<ConnectorProps> = ({
    nodes,
    correct,
    nodeRadius = 0.42,
    linkRadius = 0.08,
    onConnect,
    onComplete,
}) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);

    const isCorrect = (a: string, b: string): boolean => {
        if (!correct) return true; // fri forbinding: alt er "gyldig"
        return correct.some(([x, y]) => samePair(a, b, x, y));
    };

    const nodeById = useMemo(() => {
        const m: Record<string, ConnectorNode> = {};
        for (const nd of nodes) m[nd.id] = nd;
        return m;
    }, [nodes]);

    const handleClick = (id: string) => {
        if (selected === null) {
            setSelected(id);
            return;
        }
        if (selected === id) {
            setSelected(null);
            return;
        }
        // Allerede forbundet? Ikke dupliser.
        const exists = connections.some((c) => samePair(c.a, c.b, selected, id));
        if (exists) {
            setSelected(null);
            return;
        }
        const valid = isCorrect(selected, id);
        const next = [...connections, { a: selected, b: id, valid }];
        setConnections(next);
        setSelected(null);
        microSfx.play(valid ? 'correct' : 'incorrect');
        onConnect?.(selected, id, valid);

        // Fullført når alle korrekte par finnes blant gyldige forbindelser.
        if (correct && correct.length) {
            const allMade = correct.every(([x, y]) =>
                next.some((c) => c.valid && samePair(c.a, c.b, x, y))
            );
            if (allMade) {
                microSfx.play('complete');
                onComplete?.();
            }
        }
    };

    return (
        <group>
            {connections.map((c, i) => {
                const a = nodeById[c.a];
                const b = nodeById[c.b];
                if (!a || !b) return null;
                const color = correct ? (c.valid ? '#10b981' : '#f43f5e') : '#0ea5e9';
                return (
                    <Link
                        key={i}
                        from={a.position}
                        to={b.position}
                        color={color}
                        radius={linkRadius}
                    />
                );
            })}

            {nodes.map((nd) => {
                const isSel = selected === nd.id;
                return (
                    <Interactive
                        key={nd.id}
                        position={nd.position}
                        state={isSel ? 'selected' : 'idle'}
                        onSelect={() => handleClick(nd.id)}
                        hitArea={[nodeRadius * 3, nodeRadius * 3, nodeRadius * 3]}
                        sound={null} // egen lyd håndteres i handleClick (correct/incorrect)
                    >
                        {(s) => (
                            <mesh castShadow>
                                <sphereGeometry args={[nodeRadius, 18, 18]} />
                                <meshStandardMaterial
                                    color={nd.color ?? (isSel ? '#fbbf24' : '#f59e0b')}
                                    emissive={s === 'hover' || isSel ? '#fbbf24' : '#000000'}
                                    emissiveIntensity={s === 'hover' || isSel ? 0.5 : 0}
                                    roughness={0.45}
                                />
                            </mesh>
                        )}
                    </Interactive>
                );
            })}
        </group>
    );
};
