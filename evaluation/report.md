# Crime Investigation DSS — Evaluation Report

**Generated:** 2026-09-29 00:16:55  
**Version evaluated:** V1  
**Split:** test  

> [!IMPORTANT]
> All TEST set labels were frozen **before** any V2 scoring code was written.
> Any post-freeze changes to scoring rules will be noted in a `CHANGE LOG` section.

## Summary

| Case | Version | N | NDCG@5 | Tier Agree | L3 in Top-3 |
|------|---------|---|--------|------------|-------------|
| drugs_goa | V1 | 11 | 0.6066 | 63.6% | 1/2 |
| fraud_nagpur | V1 | 11 | 0.5681 | 63.6% | 1/2 |
| kidnap_hubballi | V1 | 12 | 0.8777 | 58.3% | 2/2 |
| murder_mysuru | V1 | 12 | 0.8958 | 75.0% | 2/2 |

---

## Per-Case Details

## Case: `drugs_goa` — drugs_goa

**Version:** V1  |  **Suspects scored:** 11

### Key Metrics

| Metric | Value |
|--------|-------|
| NDCG@5 | **0.6066** |
| Tier agreement | 63.6% (11 labelled suspects) |
| Label-3 in top-3 | 1/2 (victor dcosta) |
| Label-3 missed from top-3 | mikhail petrov |

### Full Ranking

| Rank | Suspect | Score | Tier | Label | Match? |
|------|---------|-------|------|-------|--------|
| 1 | Victor DCosta | 0.3115 | Secondary suspect | 3 | ❌ |
| 2 | Rahul Naik | 0.3073 | Secondary suspect | 2 | ✅ |
| 3 | Emily Watson | 0.2879 | Low concern | 0 | ✅ |
| 4 | Prakash Gaonkar | 0.2859 | Low concern | 1 | ✅ |
| 5 | Joseph Pinto | 0.2850 | Low concern | 0 | ✅ |
| 6 | Mikhail Petrov | 0.2762 | Low concern | 3 | ❌ |
| 7 | Dilip Borkar | 0.2756 | Low concern | 2 | ❌ |
| 8 | Yash Malhotra | 0.2728 | Low concern | 1 | ✅ |
| 9 | Anthony Fernandes | 0.2647 | Low concern | 2 | ❌ |
| 10 | Sneha Kamat | 0.2203 | Low concern | 1 | ✅ |
| 11 | Carla Rodrigues | 0.1244 | Low concern | 0 | ✅ |

### Label-0 Suspect Ranks (should be low ranks / high numbers)

| Suspect | Rank | Score | Tier |
|---------|------|-------|------|
| Emily Watson | 3 | 0.2879 | Low concern |
| Joseph Pinto | 5 | 0.2850 | Low concern |
| Carla Rodrigues | 11 | 0.1244 | Low concern |

> ⚠️ **False positive alert:** Emily Watson rank in top-3 despite label=0

### Tier Mismatches

| Suspect | Expected tier | Actual tier | Label | Score |
|---------|---------------|-------------|-------|-------|
| Victor DCosta | Primary suspect | Secondary suspect | 3 | 0.3115 |
| Mikhail Petrov | Primary suspect | Low concern | 3 | 0.2762 |
| Dilip Borkar | Secondary suspect | Low concern | 2 | 0.2756 |
| Anthony Fernandes | Secondary suspect | Low concern | 2 | 0.2647 |
### Stability Check (score change when one suspect is removed)

| Suspect removed | Max Δ score for others |
|-----------------|------------------------|
| Victor DCosta | 0.0000 |
| Mikhail Petrov | 0.0000 |
| Rahul Naik | 0.0000 |
| Anthony Fernandes | 0.0000 |
| Dilip Borkar | 0.0000 |
| Sneha Kamat | 0.0000 |
| Yash Malhotra | 0.0000 |
| Prakash Gaonkar | 0.0000 |
| Carla Rodrigues | 0.0000 |
| Emily Watson | 0.0000 |
| Joseph Pinto | 0.0000 |
> Largest instability: removing **Victor DCosta** shifts other scores by up to **0.0000**.

---

## Case: `fraud_nagpur` — Fraud Test

**Version:** V1  |  **Suspects scored:** 11

### Key Metrics

| Metric | Value |
|--------|-------|
| NDCG@5 | **0.5681** |
| Tier agreement | 63.6% (11 labelled suspects) |
| Label-3 in top-3 | 1/2 (sudhir deshmukh) |
| Label-3 missed from top-3 | anil wankhede |

### Full Ranking

| Rank | Suspect | Score | Tier | Label | Match? |
|------|---------|-------|------|-------|--------|
| 1 | Sudhir Deshmukh | 0.3439 | Secondary suspect | 3 | ❌ |
| 2 | Shirish Pande | 0.2917 | Low concern | 0 | ✅ |
| 3 | Ramesh Gaikwad | 0.2908 | Low concern | 0 | ✅ |
| 4 | Pooja Chitnis | 0.2807 | Low concern | 2 | ❌ |
| 5 | Priti Joshi | 0.2684 | Low concern | 0 | ✅ |
| 6 | Anil Wankhede | 0.2675 | Low concern | 3 | ❌ |
| 7 | Vivek Kale | 0.2671 | Low concern | 1 | ✅ |
| 8 | Farhan Ansari | 0.2440 | Low concern | 1 | ✅ |
| 9 | Rajendra Mahajan | 0.2092 | Low concern | 1 | ✅ |
| 10 | Mangesh Thakre | 0.2009 | Low concern | 2 | ❌ |
| 11 | Sulochana Deshmukh | 0.1831 | Low concern | 1 | ✅ |

### Label-0 Suspect Ranks (should be low ranks / high numbers)

| Suspect | Rank | Score | Tier |
|---------|------|-------|------|
| Shirish Pande | 2 | 0.2917 | Low concern |
| Ramesh Gaikwad | 3 | 0.2908 | Low concern |
| Priti Joshi | 5 | 0.2684 | Low concern |

> ⚠️ **False positive alert:** Shirish Pande, Ramesh Gaikwad rank in top-3 despite label=0

### Tier Mismatches

| Suspect | Expected tier | Actual tier | Label | Score |
|---------|---------------|-------------|-------|-------|
| Sudhir Deshmukh | Primary suspect | Secondary suspect | 3 | 0.3439 |
| Pooja Chitnis | Secondary suspect | Low concern | 2 | 0.2807 |
| Anil Wankhede | Primary suspect | Low concern | 3 | 0.2675 |
| Mangesh Thakre | Secondary suspect | Low concern | 2 | 0.2009 |
### Stability Check (score change when one suspect is removed)

| Suspect removed | Max Δ score for others |
|-----------------|------------------------|
| Sudhir Deshmukh | 0.0000 |
| Anil Wankhede | 0.0000 |
| Pooja Chitnis | 0.0000 |
| Mangesh Thakre | 0.0000 |
| Farhan Ansari | 0.0000 |
| Rajendra Mahajan | 0.0000 |
| Vivek Kale | 0.0000 |
| Sulochana Deshmukh | 0.0000 |
| Priti Joshi | 0.0000 |
| Ramesh Gaikwad | 0.0000 |
| Shirish Pande | 0.0000 |
> Largest instability: removing **Sudhir Deshmukh** shifts other scores by up to **0.0000**.

---

## Case: `kidnap_hubballi` — Kidnap Test

**Version:** V1  |  **Suspects scored:** 12

### Key Metrics

| Metric | Value |
|--------|-------|
| NDCG@5 | **0.8777** |
| Tier agreement | 58.3% (12 labelled suspects) |
| Label-3 in top-3 | 2/2 (sanjay patil, ganesh shinde) |

### Full Ranking

| Rank | Suspect | Score | Tier | Label | Match? |
|------|---------|-------|------|-------|--------|
| 1 | Sanjay Patil | 0.3488 | Secondary suspect | 3 | ❌ |
| 2 | Shivanand Hosamani | 0.3045 | Secondary suspect | 1 | ❌ |
| 3 | Ganesh Shinde | 0.2960 | Low concern | 3 | ❌ |
| 4 | Vithal Naik | 0.2874 | Low concern | 2 | ❌ |
| 5 | Ashok Bhat | 0.2738 | Low concern | 1 | ✅ |
| 6 | Yusuf Sait | 0.2730 | Low concern | 2 | ❌ |
| 7 | Latha Hiremath | 0.2674 | Low concern | 0 | ✅ |
| 8 | Amit Kulkarni | 0.2651 | Low concern | 0 | ✅ |
| 9 | Prakash Jadhav | 0.2577 | Low concern | 1 | ✅ |
| 10 | Rohini Kulkarni | 0.2371 | Low concern | 0 | ✅ |
| 11 | Mohan Desai | 0.2246 | Low concern | 0 | ✅ |
| 12 | Deepti Nadkarni | 0.1488 | Low concern | 0 | ✅ |

### Label-0 Suspect Ranks (should be low ranks / high numbers)

| Suspect | Rank | Score | Tier |
|---------|------|-------|------|
| Latha Hiremath | 7 | 0.2674 | Low concern |
| Amit Kulkarni | 8 | 0.2651 | Low concern |
| Rohini Kulkarni | 10 | 0.2371 | Low concern |
| Mohan Desai | 11 | 0.2246 | Low concern |
| Deepti Nadkarni | 12 | 0.1488 | Low concern |

### Tier Mismatches

| Suspect | Expected tier | Actual tier | Label | Score |
|---------|---------------|-------------|-------|-------|
| Sanjay Patil | Primary suspect | Secondary suspect | 3 | 0.3488 |
| Shivanand Hosamani | Low concern | Secondary suspect | 1 | 0.3045 |
| Ganesh Shinde | Primary suspect | Low concern | 3 | 0.2960 |
| Vithal Naik | Secondary suspect | Low concern | 2 | 0.2874 |
| Yusuf Sait | Secondary suspect | Low concern | 2 | 0.2730 |
### Stability Check (score change when one suspect is removed)

| Suspect removed | Max Δ score for others |
|-----------------|------------------------|
| Sanjay Patil | 0.0000 |
| Ganesh Shinde | 0.0000 |
| Yusuf Sait | 0.0000 |
| Prakash Jadhav | 0.0000 |
| Vithal Naik | 0.0000 |
| Shivanand Hosamani | 0.0000 |
| Ashok Bhat | 0.0000 |
| Amit Kulkarni | 0.0000 |
| Latha Hiremath | 0.0000 |
| Mohan Desai | 0.0000 |
| Rohini Kulkarni | 0.0000 |
| Deepti Nadkarni | 0.0000 |
> Largest instability: removing **Sanjay Patil** shifts other scores by up to **0.0000**.

---

## Case: `murder_mysuru` — Murder Mysore

**Version:** V1  |  **Suspects scored:** 12

### Key Metrics

| Metric | Value |
|--------|-------|
| NDCG@5 | **0.8958** |
| Tier agreement | 75.0% (12 labelled suspects) |
| Label-3 in top-3 | 2/2 (ravi gowda, manjunath naik) |

### Full Ranking

| Rank | Suspect | Score | Tier | Label | Match? |
|------|---------|-------|------|-------|--------|
| 1 | Ravi Gowda | 0.3390 | Secondary suspect | 3 | ❌ |
| 2 | Manjunath Naik | 0.2915 | Low concern | 3 | ❌ |
| 3 | Karthik Hegde | 0.2791 | Low concern | 1 | ✅ |
| 4 | Basavaiah | 0.2729 | Low concern | 0 | ✅ |
| 5 | Shalini Hegde | 0.2549 | Low concern | 1 | ✅ |
| 6 | Suresh Kumar | 0.2485 | Low concern | 0 | ✅ |
| 7 | Mahadev Swamy | 0.2454 | Low concern | 0 | ✅ |
| 8 | Dinesh Rao | 0.2401 | Low concern | 1 | ✅ |
| 9 | Vasu Gowda | 0.2235 | Low concern | 2 | ❌ |
| 10 | Anjali Hegde | 0.2197 | Low concern | 0 | ✅ |
| 11 | Imran Pasha | 0.2005 | Low concern | 0 | ✅ |
| 12 | Nandini Rao | 0.1976 | Low concern | 0 | ✅ |

### Label-0 Suspect Ranks (should be low ranks / high numbers)

| Suspect | Rank | Score | Tier |
|---------|------|-------|------|
| Basavaiah | 4 | 0.2729 | Low concern |
| Suresh Kumar | 6 | 0.2485 | Low concern |
| Mahadev Swamy | 7 | 0.2454 | Low concern |
| Anjali Hegde | 10 | 0.2197 | Low concern |
| Imran Pasha | 11 | 0.2005 | Low concern |
| Nandini Rao | 12 | 0.1976 | Low concern |

### Tier Mismatches

| Suspect | Expected tier | Actual tier | Label | Score |
|---------|---------------|-------------|-------|-------|
| Ravi Gowda | Primary suspect | Secondary suspect | 3 | 0.3390 |
| Manjunath Naik | Primary suspect | Low concern | 3 | 0.2915 |
| Vasu Gowda | Secondary suspect | Low concern | 2 | 0.2235 |
### Stability Check (score change when one suspect is removed)

| Suspect removed | Max Δ score for others |
|-----------------|------------------------|
| Ravi Gowda | 0.0000 |
| Manjunath Naik | 0.0000 |
| Vasu Gowda | 0.0000 |
| Shalini Hegde | 0.0000 |
| Karthik Hegde | 0.0000 |
| Dinesh Rao | 0.0000 |
| Basavaiah | 0.0000 |
| Mahadev Swamy | 0.0000 |
| Nandini Rao | 0.0000 |
| Suresh Kumar | 0.0000 |
| Imran Pasha | 0.0000 |
| Anjali Hegde | 0.0000 |
> Largest instability: removing **Ravi Gowda** shifts other scores by up to **0.0000**.

---

