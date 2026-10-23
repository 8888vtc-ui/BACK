le #!/usr/bin/env python3
"""Orchestration automatique de la distillation GNUBG 2M.

Surveille le processus de distillation, et à chaque checkpoint (500K, 1M, 1.5M, 2M) :
  1. Recompile le WASM Rust avec les poids actuels.
  2. Copie le WASM vers public/engine/xg_web_core.wasm.
  3. Mesure le PR via scripts/measure_pr_wasm.ts.
  4. Écrit les résultats dans plans/rapport-distillation.md.

Usage :
    python xg-web-trainer/orchestrate_distillation.py --checkpoints 500000,1000000,1500000,2000000

Le script tourne en arrière-plan et surveille le fichier de checkpoint.
"""

import argparse
import json
import os
import subprocess
import sys
import time

ROOT = os.path.join(os.path.dirname(__file__), '..')
PROGRESS_JSON = os.path.join(ROOT, 'plans', 'distillation_progress.json')
REPORT_OUT = os.path.join(ROOT, 'plans', 'rapport-distillation.md')
WEIGHTS_OUT = os.path.join(ROOT, 'public', 'engine', 'weights_xg_web.bin')
WASM_OUT = os.path.join(ROOT, 'public', 'engine', 'xg_web_core.wasm')


def run(cmd, cwd=None, timeout=600):
    """Exécute une commande et retourne (returncode, stdout)."""
    try:
        proc = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout,
        )
        return proc.returncode, proc.stdout
    except subprocess.TimeoutExpired:
        return -1, "TIMEOUT"


def recompile_wasm():
    """Recompile le WASM Rust et le copie vers public/engine/."""
    print("[orchestrate] Recompilation du WASM Rust...")
    rc, out = run(
        ["cargo", "build", "--release", "--target", "wasm32-unknown-unknown"],
        cwd=os.path.join(ROOT, 'xg-web-core'),
    )
    if rc != 0:
        print(f"[orchestrate] ERREUR compilation : {out[-500:]}")
        return False

    wasm_src = os.path.join(ROOT, 'xg-web-core', 'target', 'wasm32-unknown-unknown', 'release', 'xg_web_core.wasm')
    if not os.path.exists(wasm_src):
        print("[orchestrate] ERREUR : WASM compile introuvable")
        return False

    import shutil
    shutil.copy(wasm_src, WASM_OUT)
    print("[orchestrate] WASM copie vers public/engine/xg_web_core.wasm")
    return True


def measure_pr():
    """Mesure le PR via scripts/measure_pr_wasm.ts."""
    print("[orchestrate] Mesure du PR...")
    rc, out = run(
        ["npx", "tsx", "scripts/measure_pr_wasm.ts"],
        cwd=ROOT,
    )
    if rc != 0:
        print(f"[orchestrate] ERREUR mesure PR : {out[-500:]}")
        return None

    # Extrait le PR de la sortie (ligne "PR (Performance Rating)    : X.XX")
    pr_2ply = None
    pr_3ply = None
    for line in out.splitlines():
        if 'PR (Performance Rating)' in line:
            try:
                val = float(line.split(':')[-1].strip())
            except ValueError:
                continue
            if pr_2ply is None:
                pr_2ply = val
            else:
                pr_3ply = val
    return {'pr_2ply': pr_2ply, 'pr_3ply': pr_3ply}


def write_report(entries):
    """Écrit le rapport de distillation."""
    lines = [
        "# Rapport de distillation GNUBG 2M",
        "",
        "| Checkpoint | PR 2-ply | PR 3-ply |",
        "|---|---|---|",
    ]
    for e in entries:
        pr2 = f"{e['pr_2ply']:.2f}" if e['pr_2ply'] is not None else "-"
        pr3 = f"{e['pr_3ply']:.2f}" if e['pr_3ply'] is not None else "-"
        lines.append(f"| {e['checkpoint']} | {pr2} | {pr3} |")
    lines.append("")
    lines.append(f"_Dernière mise à jour : {time.strftime('%Y-%m-%d %H:%M:%S')}_")

    os.makedirs(os.path.dirname(REPORT_OUT), exist_ok=True)
    with open(REPORT_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"[orchestrate] Rapport ecrit : {REPORT_OUT}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoints', type=str, default='500000,1000000,1500000,2000000')
    parser.add_argument('--interval', type=int, default=60)
    args = parser.parse_args()

    checkpoints = [int(x) for x in args.checkpoints.split(',')]
    processed = set()
    entries = []

    print(f"[orchestrate] Surveillance des checkpoints : {checkpoints}")
    print(f"[orchestrate] Intervalle de verification : {args.interval}s")

    while True:
        # Lit le fichier de progression écrit par distill_gnubg_real.py
        if os.path.exists(PROGRESS_JSON):
            try:
                with open(PROGRESS_JSON, 'r', encoding='utf-8') as f:
                    prog = json.load(f)
                valid = prog.get('valid', 0)
                # Détecte les checkpoints franchis
                for cp in checkpoints:
                    if valid >= cp and cp not in processed:
                        processed.add(cp)
                        print(f"[orchestrate] Checkpoint {cp} atteint ({valid} positions) !")
                        if recompile_wasm():
                            pr = measure_pr()
                            entries.append({
                                'checkpoint': cp,
                                'pr_2ply': pr['pr_2ply'] if pr else None,
                                'pr_3ply': pr['pr_3ply'] if pr else None,
                            })
                            write_report(entries)
            except (json.JSONDecodeError, OSError):
                pass

        # Vérifie si la distillation est terminée (fichier de poids final mis à jour)
        if os.path.exists(WEIGHTS_OUT):
            mtime = os.path.getmtime(WEIGHTS_OUT)
            if time.time() - mtime < 60 and len(processed) >= len(checkpoints):
                print("[orchestrate] Distillation terminee, rapport final genere.")
                break

        time.sleep(args.interval)


if __name__ == '__main__':
    main()
