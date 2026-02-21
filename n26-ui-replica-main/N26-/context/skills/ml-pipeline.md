---
name: ml-pipeline
description: "Use when the hackathon case requires training/evaluating ML models. Contains the auto-ML template usage guide, quick model patterns, and serving instructions. Pairs with ml_pipeline_template.py."
---

# ML Pipeline — From Data to API in Minutes

## Quick Decision: Do You Even Need ML?

```
Can the problem be solved with:
├─ Rule-based logic? → Skip ML, use if/else
├─ An LLM API call? → Use ai-integration.md patterns instead
├─ Pre-trained model (sentiment, NER, classification)? → Use HuggingFace
└─ Custom model on tabular data? → Use the ML Pipeline Template below
```

**Hackathon rule:** Only train a custom model if the case SPECIFICALLY requires it or if it's your differentiator.

---

## The Auto-ML Template (ml_pipeline_template.py)

The team has a battle-tested template. Here's how to use it fast:

### Minimum Steps to Run:
1. Load your data into `df`
2. Set `TARGET` column name
3. Set `COLUMNS_TO_DROP` (IDs, irrelevant stuff)
4. Let it auto-detect features OR manually set `numerical_features` / `categorical_features`
5. Choose a preprocessor pattern (A, B, C, or D)
6. Set `SCORING_METRIC`
7. Run → it tests 5 models, tunes the best one, and generates plots

### Speed Trick: Auto-Configure Everything
```python
# Paste this BEFORE the preprocessing section to auto-configure:

import pandas as pd

# ===== AUTO-CONFIGURATION =====
df = pd.read_csv("your_data.csv")
TARGET = "your_target_column"

# Auto-detect columns to drop (IDs, high-cardinality text)
COLUMNS_TO_DROP = [col for col in df.columns if 
    'id' in col.lower() or 
    'name' in col.lower() or 
    df[col].nunique() > 0.9 * len(df)]  # likely unique IDs

# Auto-detect feature types
df_features = df.drop(columns=[TARGET] + COLUMNS_TO_DROP, errors='ignore')
numerical_features = df_features.select_dtypes(include=['number']).columns.tolist()
categorical_features = df_features.select_dtypes(include=['object', 'category']).columns.tolist()

# Also catch low-cardinality integers (likely categorical)
for col in numerical_features[:]:
    if df_features[col].nunique() <= 10:
        categorical_features.append(col)
        numerical_features.remove(col)

# Auto-select preprocessor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

if categorical_features:
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    categorical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, numerical_features),
        ('cat', categorical_transformer, categorical_features)
    ])
else:
    preprocessor = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

# Auto-select metric based on class balance
class_ratio = df[TARGET].value_counts(normalize=True).min()
if class_ratio < 0.3:
    SCORING_METRIC = 'f1'
    print(f"⚠️ Imbalanced data ({class_ratio:.1%} minority). Using F1 score.")
else:
    SCORING_METRIC = 'accuracy'
    print(f"✅ Balanced data. Using accuracy.")

print(f"Numerical: {numerical_features}")
print(f"Categorical: {categorical_features}")
print(f"Dropping: {COLUMNS_TO_DROP}")
# ===== END AUTO-CONFIGURATION =====
```

---

## Quick ML Patterns (No template needed)

### Sentiment Analysis (pre-trained, instant)
```python
from transformers import pipeline
sentiment = pipeline("sentiment-analysis")
result = sentiment("I love this product!")
# {'label': 'POSITIVE', 'score': 0.9998}
```

### Text Classification (fine-tune in minutes)
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
    ('clf', LogisticRegression(max_iter=1000))
])
text_clf.fit(X_train_texts, y_train)
predictions = text_clf.predict(X_test_texts)
```

### Anomaly Detection (for fraud/fintech cases)
```python
from sklearn.ensemble import IsolationForest
import pandas as pd

# Train on normal transactions
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(normal_transaction_features)

# Predict: -1 = anomaly, 1 = normal
predictions = model.predict(new_transactions)
anomalies = new_transactions[predictions == -1]
```

### Time Series Forecast (simple)
```python
from sklearn.linear_model import LinearRegression
import numpy as np

# Simple trend + seasonality
def forecast(values, periods_ahead=30):
    X = np.arange(len(values)).reshape(-1, 1)
    y = np.array(values)
    model = LinearRegression().fit(X, y)
    future_X = np.arange(len(values), len(values) + periods_ahead).reshape(-1, 1)
    return model.predict(future_X)
```

### Clustering (customer segmentation)
```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(features)

kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X_scaled)
df['segment'] = clusters
```

---

## Serve ML Model as API (FastAPI)

```python
# model_api.py
import pickle
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd

app = FastAPI()

# Load pre-trained model
with open("best_model.pkl", "rb") as f:
    model = pickle.load(f)

class PredictionRequest(BaseModel):
    features: dict  # {"age": 30, "income": 50000, ...}

@app.post("/predict")
async def predict(req: PredictionRequest):
    df = pd.DataFrame([req.features])
    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0].tolist()
    return {
        "prediction": int(prediction),
        "probability": probability,
        "label": "positive" if prediction == 1 else "negative"
    }
```

### Save model after training:
```python
import pickle

# After running the ML pipeline:
best_model = results['best_model']
with open("best_model.pkl", "wb") as f:
    pickle.dump(best_model, f)
print("✅ Model saved to best_model.pkl")
```

---

## Hackathon ML Shortcuts

### Don't have enough data?
```python
# Generate synthetic data with an LLM
from openai import OpenAI
import json

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{
        "role": "user",
        "content": "Generate 100 realistic banking transactions as JSON. Include: date, merchant, amount, category, is_fraudulent (5% fraud rate)."
    }],
    response_format={"type": "json_object"}
)
data = json.loads(response.choices[0].message.content)
```

### Need quick feature engineering?
```python
# Date features
df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
df['hour'] = pd.to_datetime(df['date']).dt.hour
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

# Amount features
df['amount_log'] = np.log1p(df['amount'])
df['amount_zscore'] = (df['amount'] - df['amount'].mean()) / df['amount'].std()

# Rolling features
df['amount_rolling_mean_7d'] = df.groupby('user_id')['amount'].transform(
    lambda x: x.rolling(7, min_periods=1).mean()
)
```

### Model too slow? Use a lighter one:
```python
# Instead of GridSearchCV with 5 models, just use:
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
# Done. Good enough for a hackathon.
```
