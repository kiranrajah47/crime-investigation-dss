# Calibration Tool — Crime Investigation DSS

## Purpose

This tool derives optimal evidence weights for new presets by measuring how
well different weight combinations rank suspects against **graded relevance
labels** (0-3), instead of choosing numbers by hand.

## Folder Layout

```
calibration/
├── calibrate_preset.py          # Main calibration script
├── README.md                    # This file
├── cases/
│   ├── murder_arjun_nair/       # victim.pdf, evidence.pdf, suspects.pdf
│   └── murder_mysuru/           # victim.pdf, evidence.pdf, suspects.pdf
├── labels/
│   ├── murder_arjun_nair.json   # Graded relevance labels (0-3)
│   └── murder_mysuru.json
├── murder_preset.json           # Output: chosen weights (after calibration)
└── murder_calibration_report.md # Output: full report (after calibration)
```

## Relevance Scale

| Score | Meaning |
|-------|---------|
| 3 | Very likely culprit |
| 2 | Strong suspect |
| 1 | Moderate suspicion |
| 0 | Unlikely / cleared |

## Usage

### 1. Place PDF files

Copy the case documents into each case folder. Each folder needs exactly:
- `victim.pdf` — victim details & incident
- `evidence.pdf` — evidence recovered
- `suspects.pdf` — suspect profiles (each starting with `SUSPECT: Name`)

For `murder_mysuru`, rename the original files:
- `murder2_victim.pdf` → `victim.pdf`
- `murder2_evidence.pdf` → `evidence.pdf`
- `murder2_suspects.pdf` → `suspects.pdf`

### 2. Run calibration

```bash
cd backend
python calibration/calibrate_preset.py --category murder
```

### 3. Review outputs

- `murder_calibration_report.md` — full analysis with rankings, metrics, and
  cross-validation results
- `murder_preset.json` — the chosen weights, ready to paste into Dashboard.jsx

## Adding New Categories

The script is **category-agnostic**. To calibrate a new preset (e.g. fraud):

1. Create case folders: `cases/fraud_<casename>/` with the 3 PDFs each
2. Create label files: `labels/fraud_<casename>.json` mapping suspect names
   to relevance scores (0-3)
3. Run: `python calibration/calibrate_preset.py --category fraud`

## Methodology

1. **Component extraction**: TF-IDF similarities and keyword scores are
   computed once per case using `score_all_suspects()` from `scoring.py`
2. **Grid search**: Physical 0.10–1.00, Witness 0.10–1.00, History 0.05–0.80,
   Alibi 0.05–0.60 (step 0.05)
3. **Metrics**: NDCG@5 (gain = 2^rel − 1), tier agreement, rel-0 in top 5
4. **Objective**: 0.7 × NDCG@5 + 0.3 × tier agreement
5. **Tie-breaking**: Among candidates within 0.01 of the best objective,
   pick the one closest (L2) to the Physical assault preset
6. **Validation**: 2-fold held-out check (train on one case, test on the other)

## Notes

- The script does **not modify** any existing modules (scoring.py, ranker.py,
  tfidf_scorer.py, nlp_engine.py). It only imports and reuses them.
- All presets compared against: Default and Physical assault.
- **Held-out Cross-Validation Note**: In 2-fold cross-validation, the held-out NDCG@5
  of the weights trained on one case was lower than the Physical assault preset on
  both held-out cases (0.5556 vs 0.8626 on Mysuru; 0.6701 vs 0.7231 on Arjun Nair).
  While the joint-calibrated weights (`[0.80, 0.10, 0.45, 0.25]`) achieve a higher joint
  NDCG@5 (0.8351 vs 0.7929) and tier agreement (0.5917 vs 0.5000) across both cases
  combined, the preset is added with the caveat that it is tuned to these two synthetic
  cases and may not generalise beyond them.
- Calibrated on 2 synthetic, developer-authored cases. This is calibration,
  not evidence of generalisation.
