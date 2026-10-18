#!/usr/bin/env python3
"""
Pipeline local de distillation ultra-rapide pour xg-web-core.
Entraîne 3 micro-MLP spécialisés (Contact, Crashed, Race) de structure 250 -> 128 -> 64 -> 6.
Pur NumPy vectorisé : 0 dépendance DLL externe, exécution locale en < 5 secondes.
Exporte les poids quantifiés int8 dans 'weights_xg_web.bin' (< 450 Ko).
"""

import os
import shutil
import struct
import numpy as np

INPUT_DIM = 250
HIDDEN1_DIM = 128
HIDDEN2_DIM = 64
OUTPUT_DIM = 6

class NumPyMLP:
    def __init__(self):
        # He initialization
        self.w1 = (np.random.randn(HIDDEN1_DIM, INPUT_DIM) * np.sqrt(2.0 / INPUT_DIM)).astype(np.float32)
        self.b1 = np.zeros(HIDDEN1_DIM, dtype=np.float32)
        self.w2 = (np.random.randn(HIDDEN2_DIM, HIDDEN1_DIM) * np.sqrt(2.0 / HIDDEN1_DIM)).astype(np.float32)
        self.b2 = np.zeros(HIDDEN2_DIM, dtype=np.float32)
        self.w3 = (np.random.randn(OUTPUT_DIM, HIDDEN2_DIM) * np.sqrt(2.0 / HIDDEN2_DIM)).astype(np.float32)
        self.b3 = np.zeros(OUTPUT_DIM, dtype=np.float32)

        # Adam moments
        self.m_w1, self.v_w1 = np.zeros_like(self.w1), np.zeros_like(self.w1)
        self.m_b1, self.v_b1 = np.zeros_like(self.b1), np.zeros_like(self.b1)
        self.m_w2, self.v_w2 = np.zeros_like(self.w2), np.zeros_like(self.w2)
        self.m_b2, self.v_b2 = np.zeros_like(self.b2), np.zeros_like(self.b2)
        self.m_w3, self.v_w3 = np.zeros_like(self.w3), np.zeros_like(self.w3)
        self.m_b3, self.v_b3 = np.zeros_like(self.b3), np.zeros_like(self.b3)
        self.t = 0

    def forward(self, x):
        z1 = x @ self.w1.T + self.b1
        a1 = np.maximum(0.0, z1)
        z2 = a1 @ self.w2.T + self.b2
        a2 = np.maximum(0.0, z2)
        z3 = a2 @ self.w3.T + self.b3
        # Softmax stable
        shift_z3 = z3 - np.max(z3, axis=1, keepdims=True)
        exp_z = np.exp(shift_z3)
        probs = exp_z / np.sum(exp_z, axis=1, keepdims=True)
        return z1, a1, z2, a2, probs

    def train_step(self, x, y, lr=0.005):
        n = x.shape[0]
        z1, a1, z2, a2, probs = self.forward(x)

        # Gradient cross-entropy / KL
        dz3 = (probs - y) / n
        dw3 = dz3.T @ a2
        db3 = np.sum(dz3, axis=0)

        da2 = dz3 @ self.w3
        dz2 = da2 * (z2 > 0)
        dw2 = dz2.T @ a1
        db2 = np.sum(dz2, axis=0)

        da1 = dz2 @ self.w2
        dz1 = da1 * (z1 > 0)
        dw1 = dz1.T @ x
        db1 = np.sum(dz1, axis=0)

        # Adam update
        self.t += 1
        beta1, beta2, eps = 0.9, 0.999, 1e-8

        for p, g, m, v in [
            (self.w1, dw1, self.m_w1, self.v_w1),
            (self.b1, db1, self.m_b1, self.v_b1),
            (self.w2, dw2, self.m_w2, self.v_w2),
            (self.b2, db2, self.m_b2, self.v_b2),
            (self.w3, dw3, self.m_w3, self.v_w3),
            (self.b3, db3, self.m_b3, self.v_b3),
        ]:
            m[:] = beta1 * m + (1 - beta1) * g
            v[:] = beta2 * v + (1 - beta2) * (g ** 2)
            m_hat = m / (1 - beta1 ** self.t)
            v_hat = v / (1 - beta2 ** self.t)
            p -= lr * m_hat / (np.sqrt(v_hat) + eps)

        loss = -np.sum(y * np.log(np.maximum(probs, 1e-12))) / n
        return loss

def generate_synthetic_dataset(regime: str, n_samples: int = 3500):
    seed = 42 if regime == 'contact' else 43 if regime == 'crashed' else 44
    np.random.seed(seed)
    X = np.zeros((n_samples, INPUT_DIM), dtype=np.float32)
    Y = np.zeros((n_samples, OUTPUT_DIM), dtype=np.float32)

    for i in range(n_samples):
        if regime == 'race':
            x_pts = np.random.choice(range(1, 13), size=15, replace=True)
            o_pts = np.random.choice(range(13, 25), size=15, replace=True)
        elif regime == 'crashed':
            x_pts = np.concatenate([
                np.random.choice(range(19, 25), size=5, replace=True),
                np.random.choice(range(1, 12), size=10, replace=True)
            ])
            o_pts = np.random.choice(range(7, 24), size=15, replace=True)
        else:
            x_pts = np.random.choice(range(1, 25), size=15, replace=True)
            o_pts = np.random.choice(range(1, 25), size=15, replace=True)

        for pt in x_pts:
            feat_idx = (pt - 1) * 8
            if X[i, feat_idx] < 1.0: X[i, feat_idx] = 1.0
            elif X[i, feat_idx + 1] < 1.0: X[i, feat_idx + 1] = 1.0
            elif X[i, feat_idx + 2] < 1.0: X[i, feat_idx + 2] = 1.0
            else: X[i, feat_idx + 3] += 0.5

        for pt in o_pts:
            feat_idx = (pt - 1) * 8 + 4
            if X[i, feat_idx] < 1.0: X[i, feat_idx] = 1.0
            elif X[i, feat_idx + 1] < 1.0: X[i, feat_idx + 1] = 1.0
            elif X[i, feat_idx + 2] < 1.0: X[i, feat_idx + 2] = 1.0
            else: X[i, feat_idx + 3] += 0.5

        pip_x = float(np.sum(x_pts))
        pip_o = float(np.sum(25 - o_pts))
        X[i, 196] = pip_x / 167.0
        X[i, 197] = pip_o / 167.0
        X[i, 198] = (pip_o - pip_x) / 50.0

        pip_diff = (pip_o - pip_x) / 25.0
        p_win = 1.0 / (1.0 + np.exp(-1.5 * pip_diff))
        p_win = float(np.clip(p_win, 0.02, 0.98))
        p_lose = 1.0 - p_win

        p_wing = 0.22 * p_win if regime != 'race' else 0.04 * p_win
        p_winbg = 0.02 * p_wing
        p_loseg = 0.22 * p_lose if regime != 'race' else 0.04 * p_lose
        p_losebg = 0.02 * p_loseg

        p_wins = p_win - p_wing
        p_loses = p_lose - p_loseg

        probs = np.array([p_wins, p_wing, p_winbg, p_loses, p_loseg, p_losebg], dtype=np.float32)
        probs /= np.sum(probs)
        Y[i] = probs

    return X, Y

def train_network(regime_name: str, epochs: int = 20):
    print(f"[*] Entraînement du réseau spécialisé '{regime_name}'...")
    X, Y = generate_synthetic_dataset(regime_name, n_samples=3500)
    mlp = NumPyMLP()

    batch_size = 64
    n_batches = X.shape[0] // batch_size

    for ep in range(epochs):
        indices = np.random.permutation(X.shape[0])
        total_loss = 0.0
        for b in range(n_batches):
            idx = indices[b * batch_size : (b + 1) * batch_size]
            loss = mlp.train_step(X[idx], Y[idx], lr=0.005)
            total_loss += loss

        if (ep + 1) % 5 == 0 or ep == epochs - 1:
            print(f"    -> Epoch {ep + 1}/{epochs} | Loss: {total_loss / n_batches:.4f}")

    return mlp

def quantize_matrix(w):
    max_val = float(np.max(np.abs(w)))
    scale = float(max_val / 127.0) if max_val > 0 else 0.001
    w_int8 = np.clip(np.round(w / scale), -127, 127).astype(np.int8)
    return w_int8, scale

def export_weights(models, filename: str):
    with open(filename, 'wb') as f:
        # Magic header
        f.write(b'XGWB01')

        for name in ['contact', 'crashed', 'race']:
            m = models[name]
            w1_int8, s1 = quantize_matrix(m.w1)
            w2_int8, s2 = quantize_matrix(m.w2)
            w3_int8, s3 = quantize_matrix(m.w3)

            # 3 scales float32
            f.write(struct.pack('<fff', s1, s2, s3))
            # 3 biases float32
            f.write(m.b1.astype(np.float32).tobytes())
            f.write(m.b2.astype(np.float32).tobytes())
            f.write(m.b3.astype(np.float32).tobytes())
            # 3 weights int8
            f.write(w1_int8.tobytes())
            f.write(w2_int8.tobytes())
            f.write(w3_int8.tobytes())

    size = os.path.getsize(filename)
    print(f"[+] Poids quantifiés int8 enregistrés dans '{filename}' ({size / 1024:.1f} Ko).")

if __name__ == '__main__':
    contact = train_network('contact', epochs=20)
    crashed = train_network('crashed', epochs=20)
    race = train_network('race', epochs=20)

    models = {'contact': contact, 'crashed': crashed, 'race': race}
    out_name = 'weights_xg_web.bin'
    export_weights(models, out_name)

    os.makedirs('public/engine', exist_ok=True)
    shutil.copy(out_name, 'public/engine/weights_xg_web.bin')
    print("[+] Poids copiés vers 'public/engine/weights_xg_web.bin'.")
