import pandas as pd, numpy as np
df = pd.read_csv("data/heart.csv")

print("=== 1. SHAPE / DTYPES ===")
print(df.shape)
print(df.dtypes.to_string())

print("\n=== 2. MISSING (explicit NaN) ===")
print(df.isna().sum().to_string())

print("\n=== 3. DUPLICATES ===")
print("full-row duplicates:", df.duplicated().sum())

#dropping the target column to isolate
features = df.columns.drop("HeartDisease") 

print("duplicate feature-rows (ignoring target):", df.duplicated(subset=features).sum())





# conflicting labels: same features, different target
g = df.groupby(list(feat))["HeartDisease"].nunique()
print("feature-rows with conflicting labels:", (g > 1).sum())

print("\n=== 4. TARGET BALANCE ===")
print(df["HeartDisease"].value_counts().to_string())
print(df["HeartDisease"].value_counts(normalize=True).round(3).to_string())

print("\n=== 5. CATEGORICAL CARDINALITY / LEVELS ===")
for c in df.select_dtypes(include=["object", "str"]):
    print(f"{c}: {df[c].nunique()} -> {dict(df[c].value_counts())}")

print("\n=== 6. NUMERIC DESCRIBE ===")
num = df.select_dtypes(include=[np.number])
print(num.describe().T.round(2).to_string())

print("\n=== 7. IMPOSSIBLE / SENTINEL ZEROS ===")
for c in ["RestingBP", "Cholesterol", "MaxHR", "Age"]:
    z = (df[c] == 0).sum()
    print(f"{c} == 0: {z} ({z/len(df):.1%})")
print("Oldpeak < 0:", (df["Oldpeak"] < 0).sum(), " min:", df["Oldpeak"].min())

print("\n=== 8. OUTLIERS (IQR rule, 1.5x) ===")
for c in num.columns.drop("HeartDisease"):
    q1, q3 = df[c].quantile([.25, .75]); iqr = q3 - q1
    lo, hi = q1 - 1.5*iqr, q3 + 1.5*iqr
    m = (df[c] < lo) | (df[c] > hi)
    print(f"{c}: {m.sum():4d} outside [{lo:.1f}, {hi:.1f}]  (min={df[c].min()}, max={df[c].max()})")

print("\n=== 9. CHOLESTEROL==0 vs TARGET (is the sentinel informative?) ===")
print(pd.crosstab(df["Cholesterol"].eq(0), df["HeartDisease"], normalize="index").round(3).to_string())
print(pd.crosstab(df["Cholesterol"].eq(0), df["HeartDisease"]).to_string())
