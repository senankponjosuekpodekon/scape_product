import csv
import requests

API_URL = "https://translate.googleapis.com/translate_a/single"

# simple function

def translate(text, target='pt'):
    if text is None or text == "":
        return ''
    params = {
        'client': 'gtx',
        'sl': 'auto',
        'tl': target,
        'dt': 't',
        'q': text
    }
    r = requests.get(API_URL, params=params)
    r.raise_for_status()
    data = r.json()
    return ''.join([item[0] for item in data[0]])

input_path = 'shopify_from_luminaire.csv'
output_path = 'shopify_from_luminaire_pt.csv'

with open(input_path, newline='', encoding='utf8') as fin, open(output_path, 'w', newline='', encoding='utf8') as fout:
    reader = csv.reader(fin)
    writer = csv.writer(fout)
    headers = next(reader)
    writer.writerow(headers)

    idx_handle = headers.index('Handle')
    idx_title = headers.index('Title')
    idx_body = headers.index('Body (HTML)')

    for row in reader:
        if not row:
            writer.writerow(row)
            continue
        slug = row[idx_handle]
        title = row[idx_title]
        body = row[idx_body]
        try:
            tr_title = translate(title)
            tr_body = translate(body)
            tr_slug = ''
            if slug:
                tr_slug = translate(slug.replace('-', ' '))
                import re
                tr_slug = re.sub(r'[^\w\- ]', '', tr_slug)
                tr_slug = tr_slug.strip().replace(' ', '-')
                tr_slug = tr_slug.lower()
            row[idx_handle] = tr_slug
            row[idx_title] = tr_title
            row[idx_body] = tr_body
        except Exception as e:
            print('error translating', slug, e)
        writer.writerow(row)

print('✅ traduction terminée vers', output_path)
