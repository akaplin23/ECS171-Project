# ECS171-Project - Deep Neural Networks for Heart Failure Prediction

Predicting the presence of heart disease from clinical and exercise-test
measurements, using a deep feedforward neural network.

## Dataset

**Heart Failure Prediction Dataset** — fedesoriano, Kaggle (September 2021).
<https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction>

The file is `heartfailure_dataset.zip`, which unpacks to `heart.csv`
(918 rows × 12 columns). The notebooks extract it automatically.

### Provenance

The dataset combines five older heart-disease datasets from the UCI
repository, which overlap with one another:

| Source | Observations |
|---|---|
| Cleveland | 303 |
| Hungarian | 294 |
| Switzerland | 123 |
| Long Beach VA | 200 |
| Stalog (Heart) | 270 |
| **Total** | **1,190** |
| Duplicates removed | 272 |
| **Final** | **918** |

Deduplication was done by the dataset's author, not by us. We confirmed that
no full-row or feature-only duplicates remain in `heart.csv`.

## Columns

11 features and 1 binary target. Ranges below are measured from `heart.csv`,
not copied from the source description.

| Column | Type | Description | Range / levels |
|---|---|---|---|
| `Age` | int | Patient age, in years | 28 – 77 (median 54) |
| `Sex` | category | Patient sex | `M` 725, `F` 193 |
| `ChestPainType` | category | Chest pain reported at intake | `ASY` 496, `NAP` 203, `ATA` 173, `TA` 46 |
| `RestingBP` | int | Resting blood pressure, mm Hg | 0 – 200 (median 130) |
| `Cholesterol` | int | Serum cholesterol, mg/dl | 0 – 603 (median 223) |
| `FastingBS` | binary | Fasting blood sugar > 120 mg/dl | 0 (704), 1 (214) |
| `RestingECG` | category | Resting electrocardiogram result | `Normal` 552, `LVH` 188, `ST` 178 |
| `MaxHR` | int | Maximum heart rate achieved during the exercise test, bpm | 60 – 202 (median 138) |
| `ExerciseAngina` | category | Angina induced by exercise | `N` 547, `Y` 371 |
| `Oldpeak` | float | ST depression during exercise, relative to rest, in mm | −2.6 – 6.2 (median 0.6) |
| `ST_Slope` | category | Slope of the peak exercise ST segment | `Flat` 460, `Up` 395, `Down` 63 |
| `HeartDisease` | binary | **Target.** 1 = heart disease, 0 = normal | 1 (508, 55.3%), 0 (410, 44.7%) |

### Categorical level meanings

**`ChestPainType`**
- `TA` — Typical Angina: substernal pain, provoked by exertion, relieved by rest
- `ATA` — Atypical Angina: meets some but not all of the typical criteria
- `NAP` — Non-Anginal Pain: chest pain not matching an anginal pattern
- `ASY` — Asymptomatic: no chest pain reported

**`RestingECG`**
- `Normal` — no resting abnormality
- `ST` — ST-T wave abnormality (T-wave inversion and/or ST elevation or
  depression greater than 0.05 mV)
- `LVH` — probable or definite left ventricular hypertrophy, by Estes' criteria

**`ST_Slope`** — the ST segment's behaviour at peak exercise.
`Up` (upsloping) is the normal response; `Flat` and `Down` (downsloping)
are abnormal.

Note that `RestingECG` measures the heart at rest, while `Oldpeak` and
`ST_Slope` describe its response *during* exercise. Similar names,
different measurements.

## Data quality

Three issues are present in the raw file and handled in
`data_preprocessing.ipynb`:

- **`Cholesterol == 0` in 172 rows (18.7%).** Serum cholesterol cannot be
  zero; this is an unrecorded value coded as 0. The file contains no `NaN`
  anywhere, so `isna()` does not reveal it. These rows are 88.4% positive for
  heart disease against 47.7% for rows with a recorded value, so the fact of
  being missing is itself predictive — an artifact of how the five source
  datasets were merged. We keep a `Chol_missing` indicator column rather than
  imputing the signal away.
- **`RestingBP == 0` in 1 row.** Physiologically impossible; treated as missing.
- **`Oldpeak < 0` in 13 rows** (down to −2.6). These are *not* errors — a
  negative value is ST elevation rather than depression. Retained as-is.

## Repository

| Path | Contents |
|---|---|
| `EDA.ipynb` | Exploratory analysis: distributions, class balance, outliers, correlations |
| `data_preprocessing.ipynb` | Missing values, encoding, split, imputation, transforms |
| `cleaned_data/` | Processed train/test splits used by all models |
| `data/heart.csv` | Raw dataset |
| `heartfailure_dataset.zip` | Original Kaggle download |

## Assigned paper

Glorot, Xavier, and Yoshua Bengio. "Understanding the difficulty of training
deep feedforward neural networks." *Proceedings of the Thirteenth
International Conference on Artificial Intelligence and Statistics (AISTATS)*,
PMLR 9:249–256, 2010.

## Citation

fedesoriano. (September 2021). *Heart Failure Prediction Dataset*. Retrieved
from <https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction>
