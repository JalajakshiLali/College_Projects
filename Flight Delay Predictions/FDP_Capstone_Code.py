#!/usr/bin/env python
# coding: utf-8

# In[2]:


import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.metrics import roc_auc_score



# In[3]:


def onehot_encode(df, dict):
    df = df.copy()
    for column, prefix in dict.items():
        dummies = pd.get_dummies(df[column], prefix=prefix)
        df = pd.concat([df, dummies], axis=1)
        df = df.drop(column, axis=1)
    return df


# In[4]:


def preprocess_inputs(df):
    df = df.copy()
    
    # DROPPING COLUMNS WITH MEAN VALUE GREATER THAN 25%
    missing_columns = df.loc[:, df.isna().mean() >= 0.25].columns
    df = df.drop(missing_columns, axis=1)
    
    # DROPPING UNNECESSARY COLUMNS
    df = df.drop(['year','flight_number','airline','origin_airport','destination_airport','distance','tail_number','wheels_on','taxi_in','arrival_time','arrival_delay','flight_name','dest_city','orig_city','dest_name','origin_name','orig_state','dest_state','orig_country','dest_country','orig_lat','orig_lon','dest_lat','dest_lon'], axis=1)
    
    # REPLACING THE NULL VALUES WITH MEAN VALUES
    remaining_na_columns = df.loc[:, df.isna().sum() > 0].columns
    for column in remaining_na_columns:
        df[column] = df[column].fillna(df[column].mean())
    
    # CLASSIFICATION OF TRAIN AND TEST DATASETS
    y = df['cancelled'].copy()
    X = df.drop('cancelled', axis=1).copy()
    
    # TRAIN AND TEST DATASETS
    X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.7, random_state=123)
    
    # STANDARD SCALAR
    scaler = StandardScaler()
    scaler.fit(X_train)
    
    X_train = pd.DataFrame(scaler.transform(X_train), columns=X.columns)
    X_test = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
   
    return X_train, X_test, y_train, y_test


# In[5]:


def evaluate_model(model, X_test, y_test):
    model_acc = model.score(X_test, y_test)
    print("ACCURACY: {:.2f}%".format(model_acc * 100))
    y_true = np.array(y_test)
    y_pred = model.predict(X_test)
  
    


# In[6]:


if __name__ == '__main__':        
    print(" ")







