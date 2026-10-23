import json, math

d = json.load(open('../public/engine/gnubg_weights.json'))
c = d['contact']
W1, b1, W2, b2 = c['w1'], c['b1'], c['w2'], c['b2']
H, I, O = 128, 250, 5

x = [0.0] * I
def enc(pt, n):
    if n <= 0:
        return
    base = pt * 4
