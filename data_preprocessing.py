import pandas as pd
from tqdm import tqdm
import json
import numpy as np

csv_path_template = "./h1b-data/h1b_datahubexport-%d.csv"
employers_filed_h1b = {}

def clean_stopwords(txt, stopwords):
    temp_list = txt.split(' ')
    temp_list = [i for i in temp_list if i not in stopwords]
    if temp_list:
        return ' '.join(temp_list)
    return txt

for year in range(2022, 2019, -1):
    employer_df = pd.read_csv(csv_path_template % year, sep=',')
    for _, row in tqdm(employer_df.iterrows()):
        h1b_filed = int(row['Initial Approval']) + int(row['Continuing Approval'])
        employer_name = ''.join(filter(lambda x: x.isalpha() or x.isdigit() or x.isspace(), str(row['Employer'])))
        if employer_name in employers_filed_h1b:
            employers_filed_h1b[employer_name] += h1b_filed
        else:
            employers_filed_h1b[employer_name] = h1b_filed


word_freq = {}

for employer_name in tqdm(employers_filed_h1b):
    for word in employer_name.split(' '):
        if not word in word_freq:
            word_freq[word] = 0
        word_freq[word] += 1

kv_freq = sorted([(k, v) for k, v in word_freq.items()], key = lambda x : -x[1])

stopwords = [i[0] for i in kv_freq[:200]]

clean_employers_h1b_filed = {}

for k, v in employers_filed_h1b.items():
    clean_k = clean_stopwords(k, stopwords)
    if not clean_k in clean_employers_h1b_filed:
        clean_employers_h1b_filed[clean_k] = 0
    clean_employers_h1b_filed[clean_k] += v

clean_employers_h1b_filed['EY'] = clean_employers_h1b_filed['ERNST YOUNG']

sorted_keys = sorted(list(clean_employers_h1b_filed.keys()))
print(sorted_keys[0])
all_data = {}
curr_key = sorted_keys[0][0]
i = 0
data = []
while i < len(sorted_keys):
    if sorted_keys[i].startswith(curr_key):
        data.append((sorted_keys[i], clean_employers_h1b_filed[sorted_keys[i]]))
        i += 1
    else:
        all_data[curr_key] = data.copy()
        data = []
        curr_key = sorted_keys[i][0]

all_data['#stopwords@'] = stopwords

with open('./H1B-checker/data/h1b-data.json', 'w') as fp:
    json.dump(all_data, fp)
