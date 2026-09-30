# Calibration Report — Murder Preset

_Generated: 2026-09-28 17:48:57_

## Top 10 Weight Candidates (Joint Optimum)

| Rank | Physical | Witness | History | Alibi | NDCG@5 | Tier Agr. | Objective |
|------|----------|---------|---------|-------|--------|-----------|-----------|
| 1 | 0.75 | 0.15 | 0.55 | 0.35 | 0.8377 | 0.5917 | 0.7638 |
| 2 | 0.80 | 0.10 | 0.50 | 0.35 | 0.8377 | 0.5917 | 0.7638 |
| 3 | 0.80 | 0.10 | 0.50 | 0.40 | 0.8377 | 0.5917 | 0.7638 |
| 4 | 0.80 | 0.10 | 0.55 | 0.35 | 0.8377 | 0.5917 | 0.7638 |
| 5 | 0.80 | 0.10 | 0.55 | 0.40 | 0.8377 | 0.5917 | 0.7638 |
| 6 | 0.80 | 0.10 | 0.55 | 0.45 | 0.8377 | 0.5917 | 0.7638 |
| 7 | 0.80 | 0.10 | 0.55 | 0.50 | 0.8377 | 0.5917 | 0.7638 |
| 8 | 0.80 | 0.10 | 0.55 | 0.55 | 0.8377 | 0.5917 | 0.7638 |
| 9 | 0.80 | 0.10 | 0.60 | 0.35 | 0.8377 | 0.5917 | 0.7638 |
| 10 | 0.80 | 0.10 | 0.60 | 0.40 | 0.8377 | 0.5917 | 0.7638 |

## Chosen Weights

| Parameter | Value |
|-----------|-------|
| Physical evidence | 0.80 |
| Witness statement | 0.10 |
| Past history | 0.45 |
| Alibi penalty | 0.25 |

**Joint objective**: 0.7621 (NDCG@5=0.8351, Tier=0.5917)

## 2-Fold Cross-Validation

### Train: murder_arjun_nair

- **Train weights**: phys=0.10, wit=0.70, hist=0.05, alibi=0.05
- **Train objective**: 0.8136 (NDCG@5=0.9051, Tier=0.6000)
- **Held-out case**: murder_mysuru
- **Held-out NDCG@5**: 0.5556
- **Held-out Tier agreement**: 0.5000
- **Held-out Objective**: 0.5389

### Train: murder_mysuru

- **Train weights**: phys=0.75, wit=0.10, hist=0.75, alibi=0.60
- **Train objective**: 0.8732 (NDCG@5=0.9617, Tier=0.6667)
- **Held-out case**: murder_arjun_nair
- **Held-out NDCG@5**: 0.6701
- **Held-out Tier agreement**: 0.6000
- **Held-out Objective**: 0.6490

## Existing Preset Performance

| Preset | NDCG@5 | Tier Agr. | Objective |
|--------|--------|-----------|-----------|
| Default | 0.7470 | 0.5000 | 0.6729 |
| Physical assault | 0.7929 | 0.5000 | 0.7050 |
| **Murder (calibrated)** | 0.8351 | 0.5917 | 0.7621 |

## Rankings — murder_arjun_nair

### Calibrated Murder Preset

| Rank | Name | Score | Tier | Relevance |
|------|------|-------|------|-----------|
| 1 | Vikram Kamath | 0.4493 | Secondary | 3 |
| 2 | Suresh Bhat | 0.3790 | Secondary | 2 |
| 3 | Praveen D'Souza | 0.3507 | Secondary | 1 |
| 4 | Anita Shetty | 0.3414 | Secondary | 0 |
| 5 | Kiran Alva | 0.3389 | Secondary | 2 |
| 6 | Ramesh Nayak | 0.3273 | Secondary | 1 |
| 7 | Deepa Nair | 0.3255 | Secondary | 0 |
| 8 | Ganesh Prabhu | 0.3148 | Secondary | 3 |
| 9 | Latha Rodrigues | 0.3002 | Secondary | 1 |
| 10 | Mohammed Irfan | 0.2861 | Low | 0 |

### Physical Assault Preset

| Rank | Name | Score | Tier | Relevance |
|------|------|-------|------|-----------|
| 1 | Vikram Kamath | 0.5157 | Secondary | 3 |
| 2 | Suresh Bhat | 0.4422 | Secondary | 2 |
| 3 | Praveen D'Souza | 0.4076 | Secondary | 1 |
| 4 | Anita Shetty | 0.3980 | Secondary | 0 |
| 5 | Kiran Alva | 0.3899 | Secondary | 2 |
| 6 | Ramesh Nayak | 0.3847 | Secondary | 1 |
| 7 | Deepa Nair | 0.3800 | Secondary | 0 |
| 8 | Ganesh Prabhu | 0.3765 | Secondary | 3 |
| 9 | Latha Rodrigues | 0.3417 | Secondary | 1 |
| 10 | Mohammed Irfan | 0.3298 | Secondary | 0 |

## Rankings — murder_mysuru

### Calibrated Murder Preset

| Rank | Name | Score | Tier | Relevance |
|------|------|-------|------|-----------|
| 1 | Ravi Gowda | 0.4089 | Secondary | 3 |
| 2 | Manjunath Naik | 0.3839 | Secondary | 3 |
| 3 | Basavaiah | 0.3358 | Secondary | 0 |
| 4 | Karthik Hegde | 0.3269 | Secondary | 1 |
| 5 | Vasu Gowda | 0.3006 | Secondary | 2 |
| 6 | Suresh Kumar | 0.2922 | Low | 0 |
| 7 | Mahadev Swamy | 0.2843 | Low | 0 |
| 8 | Dinesh Rao | 0.2760 | Low | 1 |
| 9 | Shalini Hegde | 0.2631 | Low | 1 |
| 10 | Imran Pasha | 0.2481 | Low | 0 |
| 11 | Anjali Hegde | 0.2474 | Low | 0 |
| 12 | Nandini Rao | 0.2437 | Low | 0 |

### Physical Assault Preset

| Rank | Name | Score | Tier | Relevance |
|------|------|-------|------|-----------|
| 1 | Ravi Gowda | 0.4609 | Secondary | 3 |
| 2 | Manjunath Naik | 0.3998 | Secondary | 3 |
| 3 | Basavaiah | 0.3900 | Secondary | 0 |
| 4 | Karthik Hegde | 0.3778 | Secondary | 1 |
| 5 | Suresh Kumar | 0.3387 | Secondary | 0 |
| 6 | Shalini Hegde | 0.3380 | Secondary | 1 |
| 7 | Mahadev Swamy | 0.3297 | Secondary | 0 |
| 8 | Dinesh Rao | 0.3222 | Secondary | 1 |
| 9 | Vasu Gowda | 0.3121 | Secondary | 2 |
| 10 | Anjali Hegde | 0.3048 | Secondary | 0 |
| 11 | Nandini Rao | 0.2813 | Low | 0 |
| 12 | Imran Pasha | 0.2691 | Low | 0 |

> **Note**: The held-out NDCG@5 of the chosen weights is NOT better 
> than the current Physical assault preset on both cases. The preset 
> is still added but may not generalise beyond these two cases.

---

**Caveat**: Calibrated on 2 synthetic, developer-authored cases. This is calibration, not evidence of generalisation.
