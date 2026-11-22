// Preprocessing + forward pass for the Xavier+Adam sigmoid DNN.
// Mirrors data_preprocessing.ipynb exactly: impute -> Box-Cox / Yeo-Johnson
// -> standardize. All parameters were fitted on the 734 training rows.

export function boxcox(x, lam) {
  return Math.abs(lam) < 1e-12 ? Math.log(x) : (Math.pow(x, lam) - 1) / lam;
}

export function yeojohnson(x, lam) {
  if (x >= 0) {
    return Math.abs(lam) < 1e-12
      ? Math.log(x + 1)
      : (Math.pow(x + 1, lam) - 1) / lam;
  }
  return Math.abs(lam - 2) < 1e-12
    ? -Math.log(-x + 1)
    : -(Math.pow(-x + 1, 2 - lam) - 1) / (2 - lam);
}

// raw: {Age, Sex:'M'|'F', ChestPainType, RestingBP, Cholesterol, FastingBS,
//       RestingECG, MaxHR, ExerciseAngina:'Y'|'N', Oldpeak, ST_Slope}
export function buildFeatures(raw, P) {
  const cholMissing = Number(raw.Cholesterol) === 0 ? 1 : 0;
  let chol = cholMissing ? P.medians.Cholesterol : Number(raw.Cholesterol);
  let bp = Number(raw.RestingBP) === 0 ? P.medians.RestingBP : Number(raw.RestingBP);

  const cont = {
    Age:         boxcox(Number(raw.Age), P.boxcox_lambdas.Age),
    RestingBP:   boxcox(bp,              P.boxcox_lambdas.RestingBP),
    Cholesterol: boxcox(chol,            P.boxcox_lambdas.Cholesterol),
    MaxHR:       boxcox(Number(raw.MaxHR), P.boxcox_lambdas.MaxHR),
    Oldpeak:     yeojohnson(Number(raw.Oldpeak), P.yeojohnson_lambda_oldpeak),
  };
  P.scaler_cols.forEach((c, i) => {
    cont[c] = (cont[c] - P.scaler_mean[i]) / P.scaler_scale[i];
  });

  const v = {
    Age: cont.Age,
    Sex: raw.Sex === "M" ? 1 : 0,
    RestingBP: cont.RestingBP,
    Cholesterol: cont.Cholesterol,
    FastingBS: Number(raw.FastingBS),
    MaxHR: cont.MaxHR,
    ExerciseAngina: raw.ExerciseAngina === "Y" ? 1 : 0,
    Oldpeak: cont.Oldpeak,
    Chol_missing: cholMissing,
    // drop_first=True: ASY / LVH / Down are the all-zero reference levels
    ChestPainType_ATA: raw.ChestPainType === "ATA" ? 1 : 0,
    ChestPainType_NAP: raw.ChestPainType === "NAP" ? 1 : 0,
    ChestPainType_TA:  raw.ChestPainType === "TA"  ? 1 : 0,
    RestingECG_Normal: raw.RestingECG === "Normal" ? 1 : 0,
    RestingECG_ST:     raw.RestingECG === "ST"     ? 1 : 0,
    ST_Slope_Flat:     raw.ST_Slope === "Flat"     ? 1 : 0,
    ST_Slope_Up:       raw.ST_Slope === "Up"       ? 1 : 0,
  };
  return P.feature_order.map(k => v[k]);
}

const sigmoid = z => 1 / (1 + Math.exp(-z));

export function forward(x, net) {
  let h = x;
  for (const L of net.hidden) {
    h = L.W.map((row, i) => sigmoid(row.reduce((s, w, j) => s + w * h[j], 0) + L.b[i]));
  }
  const logit = net.out.W[0].reduce((s, w, j) => s + w * h[j], 0) + net.out.b[0];
  return sigmoid(logit);
}

export function predict(raw, bundle) {
  return forward(buildFeatures(raw, bundle.preproc), bundle.dnn);
}
